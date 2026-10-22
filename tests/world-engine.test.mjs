import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { heightAt, isWalkable, stepCharacter, findPath, canWalkLine, riverX, shoreline, FIXED_STEP } from '../src/world/engine/terrain.ts'
import { districts, placeEntries } from '../src/world/map.ts'
import { roofProfile } from '../src/world/native/shapes.ts'

const stateAt = (x, z) => ({ x, z, y: heightAt(x, z), vx: 0, vz: 0, vy: 0, grounded: true })

test('roof geometry and tile seams remain finite at and beyond the carved eaves', () => {
  for (const width of [3.1, 7.7, 9.2]) for (let i = 0; i <= 40; i++) {
    const x = (i / 40 - .5) * (width + .6)
    assert.ok(Number.isFinite(roofProfile(x, i * .1, width, 1.8)))
  }
})

test('all five territories are reachable by walking from the Trailhead', () => {
  const start = { x: 2, z: 12 }
  for (const district of districts.slice(1)) {
    const target = { x: district.entrance[0], z: district.entrance[1] }
    const path = findPath(start, target, [])
    assert.ok(path.length, `No route to ${district.id}`)
    let previous = start
    for (const waypoint of path) { assert.ok(canWalkLine(previous, waypoint, []), `Unwalkable route to ${district.id}`); previous = waypoint }
    assert.ok(Math.hypot(previous.x - target.x, previous.z - target.z) < 1)
  }
})

test('cross-map navigation crosses the river at a bridge rather than walking on water', () => {
  const from = { x: -28, z: 11 }, to = { x: 28, z: 10 }
  assert.equal(isWalkable(riverX(11), 11), false)
  assert.equal(canWalkLine(from, to, []), false)
  const path = findPath(from, to, [])
  assert.ok(path.length > 1)
  let previous = from
  for (const waypoint of path) { assert.ok(canWalkLine(previous, waypoint, [])); previous = waypoint }
})

test('the actual controller follows a cross-map path without per-territory boundaries', () => {
  const state = stateAt(-26, 10), target = { x: 22, z: 2 }
  const path = findPath(state, target, [{ kind: 'circle', x: -26, z: 3, r: 4.4 }])
  assert.ok(path.length)
  let waypoint = 0
  for (let frame = 0; frame < 2400 && waypoint < path.length; frame++) {
    const dx = path[waypoint].x - state.x, dz = path[waypoint].z - state.z, length = Math.hypot(dx, dz)
    if (length < .28) { waypoint++; continue }
    stepCharacter(state, { x: dx / length, z: dz / length }, FIXED_STEP, [{ kind: 'circle', x: -26, z: 3, r: 4.4 }], true)
  }
  assert.equal(waypoint, path.length)
  assert.ok(Math.hypot(state.x - target.x, state.z - target.z) < .6)
})

test('building collisions stop penetration and allow sliding along a wall', () => {
  const state = stateAt(12, 0), collider = { kind: 'box', x: 15, z: 0, w: 2, d: 5 }
  for (let i = 0; i < 120; i++) stepCharacter(state, { x: 1, z: .28 }, FIXED_STEP, [collider])
  assert.ok(state.x < 13.7)
  assert.ok(state.z > 1.4)
  assert.ok(isWalkable(state.x, state.z, [collider]))
})

test('automatic walking negotiates a wall and tight tree corner without getting stuck', () => {
  const state = stateAt(2, 12), target = { x: 21, z: 2 }
  const colliders = [{ kind: 'box', x: 8, z: 8, w: 5.5, d: .6 }, { kind: 'circle', x: 12, z: 8, r: .45 }]
  const path = findPath(state, target, colliders)
  assert.ok(path.length)
  let waypoint = 0
  for (let frame = 0; frame < 1800 && waypoint < path.length; frame++) {
    const dx = path[waypoint].x - state.x, dz = path[waypoint].z - state.z, distance = Math.hypot(dx, dz)
    if (distance < .28) { waypoint++; continue }
    stepCharacter(state, { x: dx / distance, z: dz / distance }, FIXED_STEP, colliders, true, false, true)
  }
  assert.equal(waypoint, path.length)
  assert.ok(Math.hypot(state.x - target.x, state.z - target.z) < .5)
})

test('fixed-step movement is independent of 24, 60, or 144Hz rendering', () => {
  const run = (hz) => {
    const state = stateAt(10, 0)
    let accumulator = 0, count = 0
    for (let frame = 0; frame < hz * 2; frame++) {
      accumulator += 1 / hz
      while (accumulator + 1e-10 >= FIXED_STEP) { stepCharacter(state, { x: 0, z: 1 }, FIXED_STEP, []); accumulator -= FIXED_STEP; count++ }
    }
    return { state, count }
  }
  const a = run(24), b = run(60), c = run(144)
  assert.equal(a.count, 120); assert.equal(c.count, 120)
  assert.ok(Math.abs(a.state.z - b.state.z) < 1e-8)
  assert.ok(Math.abs(c.state.z - b.state.z) < 1e-8)
})

test('thumbstick strength controls speed rather than normalizing every drag to full speed', () => {
  const half = stateAt(10, 0), full = stateAt(10, 0)
  for (let i = 0; i < 120; i++) { stepCharacter(half, { x: 0, z: .5 }, FIXED_STEP, []); stepCharacter(full, { x: 0, z: 1 }, FIXED_STEP, []) }
  assert.ok(Math.abs(half.z / full.z - .5) < .01)
})

test('jump lands back on the native terrain, including the highland', () => {
  const state = stateAt(21, -23), floor = state.y
  let maximum = state.y
  for (let i = 0; i < 120; i++) { stepCharacter(state, { x: 0, z: 0 }, FIXED_STEP, [], false, i === 0); maximum = Math.max(maximum, state.y) }
  assert.ok(maximum > floor + .6)
  assert.equal(state.grounded, true); assert.ok(Math.abs(state.y - floor) < 1e-8)
})

test('coast and outer world boundaries are respected', () => {
  assert.equal(isWalkable(12, shoreline(12) + 3), false)
  assert.equal(isWalkable(60, 0), false)
  assert.equal(isWalkable(2, 12), true)
})

test('all published notes become native garden plants with preserved growth states', () => {
  const entries = JSON.parse(readFileSync(new URL('../src/generated/garden-manifest.json', import.meta.url))).essays
  const plants = placeEntries(entries), reordered = placeEntries(entries.slice().reverse())
  assert.equal(plants.length, entries.length)
  assert.deepEqual(plants, reordered)
  assert.equal(new Set(plants.map((plant) => plant.slug)).size, entries.length)
  for (const plant of plants) { assert.ok(Number.isFinite(plant.x + plant.z)); assert.equal(plant.status, entries.find((entry) => entry.slug === plant.slug).status) }
})
