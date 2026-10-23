import { test } from 'node:test'
import assert from 'node:assert/strict'
import { vehicleDefinitions, createVehicleState, stepVehicle, vehicleAction, isBoatable, boardingPoint, exitPoint, drivingCameraYaw } from '../src/world/engine/vehicles.ts'
import { heightAt, isWalkable, FIXED_STEP, WORLD_RADIUS, findPath, canWalkLine } from '../src/world/engine/terrain.ts'
import { OrthographicCamera, Vector3 } from 'three'

const create = id => createVehicleState(vehicleDefinitions.find(vehicle => vehicle.id === id))
function advance(state, seconds, input = { x: 0, z: 0 }, colliders = []) {
  for (let i = 0; i < Math.round(seconds / FIXED_STEP); i++) stepVehicle(state, input, FIXED_STEP, colliders)
}

function steeringSample(id, heading, steer, reverse = false) {
  const state = create(id)
  Object.assign(state, { x: id === 'boat' ? 0 : 70, z: id === 'boat' ? 70 : -30, heading, speed: reverse ? -3 : 6 })
  const start = { ...state }
  advance(state, .25, { x: steer, z: reverse ? -1 : 1 })
  // With +Z forward and +Y up, the driver's right is forward cross up.
  const lateral = (state.x - start.x) * -Math.cos(heading) + (state.z - start.z) * Math.sin(heading)
  return { state, start, lateral }
}

test('left and right steering follow the driver’s side at every compass heading', () => {
  for (const id of ['bike', 'cruiser', 'boat', 'plane']) for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) for (const steer of [-1, 1]) {
    const { lateral } = steeringSample(id, heading, steer)
    assert.ok(lateral * steer > .01, `${id}: ${steer < 0 ? 'left' : 'right'} steered to the wrong side at heading ${heading}`)
  }
})

test('backing up preserves natural steering-wheel behavior rather than swapping the controls', () => {
  for (const id of ['bike', 'cruiser', 'boat', 'plane']) for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) for (const steer of [-1, 1]) {
    const { state, start, lateral } = steeringSample(id, heading, steer, true)
    assert.ok(state.speed < 0)
    assert.ok(lateral * steer > .01, `${id}: reversing moved to the wrong side`)
    assert.ok((state.heading - start.heading) * steer > 0, `${id}: reverse yaw must be opposite to forward yaw`)
  }
})

test('airborne left and right inputs bank toward the corresponding side', () => {
  for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) for (const steer of [-1, 1]) {
    const state = create('plane')
    Object.assign(state, { x: 0, z: 0, y: 26, heading, speed: 19, phase: 'flying' })
    advance(state, .25, { x: steer, z: 0 })
    const lateral = state.x * -Math.cos(heading) + state.z * Math.sin(heading)
    assert.ok(lateral * steer > .1, `the plane banked the wrong way at heading ${heading}`)
  }
})

test('the driving camera keeps forward up-screen and steering on the expected screen side', () => {
  for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const yaw = drivingCameraYaw(.604, heading, FIXED_STEP, true)
    const camera = new OrthographicCamera(-20, 20, 15, -15, .1, 900)
    camera.position.set(Math.sin(yaw) * 35, 25, Math.cos(yaw) * 35)
    camera.lookAt(0, 0, 0); camera.updateMatrixWorld()
    const origin = new Vector3().project(camera)
    const forward = new Vector3(Math.sin(heading), 0, Math.cos(heading)).project(camera)
    assert.ok(forward.y > origin.y, 'forward should lead away from the viewer')
    for (const steer of [-1, 1]) {
      const { state, start } = steeringSample('bike', heading, steer)
      const projected = new Vector3(state.x - start.x, 0, state.z - start.z).project(camera)
      assert.ok((projected.x - origin.x) * steer > .001, 'left/right must match the view from behind the vehicle')
    }
  }
})

test('camera tracking takes the short turn across angle wrap and is frame-rate independent', () => {
  const current = Math.PI - .02
  const next = drivingCameraYaw(current, .02, FIXED_STEP)
  assert.ok(next > current && next < current + .04, 'do not orbit a full circle across the seam')
  const track = hz => { let yaw = .604; for (let i = 0; i < hz; i++) yaw = drivingCameraYaw(yaw, Math.PI / 2, 1 / hz); return yaw }
  assert.ok(Math.abs(track(30) - track(60)) < 1e-9)
  assert.ok(Math.abs(track(144) - track(60)) < 1e-9)
})

test('all five vehicles have land-accessible boarding points and connected routes', () => {
  for (const definition of vehicleDefinitions) {
    const state = createVehicleState(definition), target = boardingPoint(state)
    assert.ok(isWalkable(target.x, target.z), definition.id)
    const path = findPath({ x: 2, z: 12 }, target, [])
    assert.ok(path.length, `no connected route to ${definition.id}`)
    let previous = { x: 2, z: 12 }
    for (const point of path) { assert.ok(canWalkLine(previous, point, [])); previous = point }
  }
})

test('bike and Land Cruiser travel faster than walking, reverse, and stay grounded', () => {
  for (const id of ['bike', 'cruiser']) {
    const state = create(id); state.x = 70; state.z = -20; state.heading = 0
    advance(state, 2, { x: 0, z: 1 })
    assert.ok(state.z > -7)
    assert.equal(state.y, heightAt(state.x, state.z))
    advance(state, 2, { x: 0, z: -1 })
    assert.ok(state.speed < 0)
    assert.ok(exitPoint(state, []))
  }
})

test('swept collision stops a boosted bike before a thin wall', () => {
  const state = create('bike'); state.x = 70; state.z = -20; state.heading = 0; state.speed = 26
  const wall = { kind: 'box', x: 70, z: -15, w: 8, d: .25 }
  for (let i = 0; i < 120; i++) stepVehicle(state, { x: 0, z: 1 }, FIXED_STEP, [wall], true)
  assert.ok(state.z < -15.5, `bike passed through wall at ${state.z}`)
})

test('land vehicles cannot enter the sea or escape the expanded world', () => {
  const state = create('cruiser'); state.x = 85; state.z = 22; state.heading = 0
  advance(state, 12, { x: 0, z: 1 })
  assert.ok(isWalkable(state.x, state.z, [], 1.05))
  state.x = WORLD_RADIUS - 4; state.z = 0; state.heading = Math.PI / 2
  advance(state, 5, { x: 0, z: 1 })
  assert.ok(Math.hypot(state.x, state.z) < WORLD_RADIUS - 1)
})

test('boat boards from land, sails on water, and exits only within reach of shore', () => {
  const boat = create('boat'), approach = boardingPoint(boat)
  assert.ok(isWalkable(approach.x, approach.z))
  assert.ok(isBoatable(boat.x, boat.z))
  assert.ok(exitPoint(boat, []))
  advance(boat, 4, { x: 0, z: 1 })
  assert.ok(boat.z > 60)
  assert.ok(isBoatable(boat.x, boat.z))
  assert.equal(exitPoint(boat, []), null)
  boat.heading = Math.PI
  advance(boat, 12, { x: 0, z: 1 })
  assert.ok(isBoatable(boat.x, boat.z))
  const landing = exitPoint(boat, [])
  assert.ok(landing && isWalkable(landing.x, landing.z))
})

test('plane takes off, can be steered, then returns to the actual runway and lands', () => {
  const plane = create('plane')
  vehicleAction(plane); advance(plane, 7)
  assert.equal(plane.phase, 'flying')
  assert.ok(plane.y > 20)
  assert.equal(exitPoint(plane, []), null)
  const heading = plane.heading; advance(plane, 1, { x: 1, z: 1 })
  assert.ok(Math.abs(plane.heading - heading) > .5)
  vehicleAction(plane)
  for (let i = 0; i < 3600 && plane.phase !== 'parked'; i++) stepVehicle(plane, { x: 0, z: 0 }, FIXED_STEP, [])
  assert.equal(plane.phase, 'parked')
  assert.ok(Math.abs(plane.x + 62) < .1)
  assert.ok(plane.z > -39 && plane.z < -36)
  assert.equal(plane.y, heightAt(plane.x, plane.z))
  assert.ok(exitPoint(plane, []))
})

test('rocket rises vertically, hovers, and lands upright on the same pad', () => {
  const rocket = create('rocket'), initial = { ...rocket }
  vehicleAction(rocket); advance(rocket, 11)
  assert.equal(rocket.phase, 'hovering')
  assert.ok(rocket.y > initial.y + 83)
  assert.equal(rocket.x, initial.x); assert.equal(rocket.z, initial.z)
  assert.equal(exitPoint(rocket, []), null)
  advance(rocket, 1, { x: 1, z: 1 })
  assert.ok(rocket.x > initial.x)
  vehicleAction(rocket)
  for (let i = 0; i < 2400 && rocket.phase !== 'parked'; i++) stepVehicle(rocket, { x: 0, z: 0 }, FIXED_STEP, [])
  assert.equal(rocket.phase, 'parked')
  assert.equal(rocket.x, initial.x); assert.equal(rocket.z, initial.z); assert.equal(rocket.y, initial.y)
  assert.ok(exitPoint(rocket, []))
})
