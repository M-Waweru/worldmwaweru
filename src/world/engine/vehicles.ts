import { heightAt, isWalkable, shoreline, WORLD_RADIUS, type Collider, type Point } from './terrain.ts'

export type VehicleId = 'bike' | 'cruiser' | 'boat' | 'plane' | 'rocket'
export type VehiclePhase = 'parked' | 'driving' | 'launching' | 'flying' | 'hovering' | 'returning' | 'landing'
export type VehicleDefinition = { id: VehicleId; name: string; description: string; location: string; x: number; z: number; heading: number; radius: number; topSpeed: number }
export type VehicleState = Point & { id: VehicleId; y: number; heading: number; speed: number; phase: VehiclePhase; clock: number }
export type VehicleStatus = { id: VehicleId; name: string; speed: number; altitude: number; phase: VehiclePhase; action: string | null; canExit: boolean }

export const vehicleDefinitions: VehicleDefinition[] = [
  { id: 'bike', name: 'My Zontes 250V', description: 'A low-slung cruiser, a brown saddle, and a little freedom. Take the country roads.', location: 'By the homestead', x: 6.5, z: 12, heading: Math.PI / 2, radius: .48, topSpeed: 19 },
  { id: 'cruiser', name: 'The Land Cruiser', description: 'Four wheels, wide-open country. Head for the airstrip or the northern loop.', location: 'The homestead driveway', x: 13, z: 10, heading: Math.PI / 2, radius: 1.05, topSpeed: 15 },
  { id: 'boat', name: 'The little boat', description: 'Leave the waterfront behind. Follow the coastline and come back to shore to step out.', location: 'At the waterfront dock', x: 24, z: 38, heading: 0, radius: .9, topSpeed: 9 },
  { id: 'plane', name: 'The bush plane', description: 'Taxi, take off, and see the garden from above. The return control brings you back to the runway.', location: 'The western airstrip', x: -62, z: -65, heading: 0, radius: 1.8, topSpeed: 28 },
  { id: 'rocket', name: 'The Starling', description: 'A vertical hop into the sky. Hover over the whole world, then return gently to the launch pad.', location: 'The eastern launch field', x: 61, z: -61, heading: 0, radius: 2.1, topSpeed: 0 },
]
export const vehicleDefinition = (id: VehicleId) => vehicleDefinitions.find(vehicle => vehicle.id === id)!
export function createVehicleState(definition: VehicleDefinition): VehicleState {
  return { id: definition.id, x: definition.x, z: definition.z, y: definition.id === 'boat' ? .43 : heightAt(definition.x, definition.z), heading: definition.heading, speed: 0, phase: 'parked', clock: 0 }
}
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const approach = (value: number, target: number, response: number, dt: number) => value + (target - value) * (1 - Math.exp(-response * dt))
const turnTo = (heading: number, target: number, dt: number) => heading + Math.atan2(Math.sin(target - heading), Math.cos(target - heading)) * (1 - Math.exp(-dt * 4))

/** Vehicles face local +Z, so the driving camera belongs on the opposite side. */
export function drivingCameraYaw(current: number, heading: number, dt: number, reducedMotion = false) {
  const behind = heading + Math.PI
  return reducedMotion ? behind : turnTo(current, behind, dt)
}

export function isBoatable(x: number, z: number) { return Math.hypot(x, z) < WORLD_RADIUS - 2 && z > shoreline(x) + 1.35 }

/** Swept collision samples prevent a fast bike from tunnelling through walls. */
function moveGround(state: VehicleState, distance: number, colliders: readonly Collider[]) {
  const definition = vehicleDefinition(state.id)
  const count = Math.max(1, Math.ceil(Math.abs(distance) / .18))
  for (let i = 0; i < count; i++) {
    const x = state.x + Math.sin(state.heading) * distance / count, z = state.z + Math.cos(state.heading) * distance / count
    const allowed = state.id === 'boat' ? isBoatable(x, z) : isWalkable(x, z, colliders, definition.radius)
    if (!allowed) { state.speed = 0; break }
    state.x = x; state.z = z
  }
  state.y = state.id === 'boat' ? .43 : heightAt(state.x, state.z)
}

export function vehicleAction(state: VehicleState) {
  if (state.id === 'rocket') {
    if (state.phase === 'parked') state.phase = 'launching'
    else if (state.phase === 'hovering' || state.phase === 'launching') state.phase = 'landing'
    state.clock = 0
  } else if (state.id === 'plane') {
    state.phase = state.phase === 'parked' ? 'launching' : state.phase === 'returning' || state.phase === 'landing' ? 'flying' : 'returning'
    state.clock = 0
  }
}

/** All vehicle motion uses simulation time, so menus, blur, and pause stop it. */
export function stepVehicle(state: VehicleState, input: Point, dt: number, colliders: readonly Collider[], boost = false) {
  if (!Number.isFinite(state.x + state.y + state.z + state.speed + state.heading)) { Object.assign(state, createVehicleState(vehicleDefinition(state.id))); return }
  dt = clamp(dt, 0, .05)
  state.clock += dt
  const definition = vehicleDefinition(state.id), throttle = clamp(input.z, -1, 1), steer = clamp(input.x, -1, 1)
  if (state.id === 'rocket') {
    const floor = heightAt(definition.x, definition.z)
    if (state.phase === 'launching') {
      state.y = Math.min(floor + 84, state.y + Math.min(16, 2 + state.clock * 3) * dt)
      if (state.y >= floor + 84) { state.phase = 'hovering'; state.clock = 0 }
    } else if (state.phase === 'hovering') {
      state.x = clamp(state.x + steer * dt * 3, definition.x - 8, definition.x + 8)
      state.z = clamp(state.z + throttle * dt * 3, definition.z - 8, definition.z + 8)
      state.y = floor + 84 + Math.sin(state.clock * 1.4) * .12
    } else if (state.phase === 'landing') {
      state.x = approach(state.x, definition.x, 1.8, dt); state.z = approach(state.z, definition.z, 1.8, dt)
      state.y = Math.max(floor, state.y - clamp((state.y - floor) * .7, .35, 12) * dt)
      if (state.y <= floor + .015) Object.assign(state, createVehicleState(definition))
    }
    state.speed = 0
    return
  }
  if (state.id === 'plane' && state.phase !== 'parked') {
    if (state.phase === 'returning') {
      const dx = -62 - state.x, dz = -86 - state.z
      state.heading = turnTo(state.heading, Math.atan2(dx, dz), dt)
      state.speed = approach(state.speed, 20, 2, dt)
      state.y = approach(state.y, 26, 1.2, dt)
      if (Math.hypot(dx, dz) < 5) { state.phase = 'landing'; state.x = -62; state.z = -86; state.heading = 0 }
    } else if (state.phase === 'landing') {
      state.heading = 0; state.x = approach(state.x, -62, 3, dt)
      state.speed = approach(state.speed, 12, 2, dt)
      state.y = heightAt(-62, state.z) + Math.max(0, (-38 - state.z) * .5)
      if (state.z >= -38) { state.phase = 'parked'; state.speed = 0; state.y = heightAt(state.x, state.z); return }
    } else {
      state.speed = approach(state.speed, clamp(19 + throttle * 9, 10, 28), .9, dt)
      state.heading -= steer * dt * .85
      if (state.speed > 10) state.y = Math.min(heightAt(state.x, state.z) + 24, state.y + 6 * dt)
      if (state.y > heightAt(state.x, state.z) + 22) state.phase = 'flying'
    }
    const x = state.x + Math.sin(state.heading) * state.speed * dt, z = state.z + Math.cos(state.heading) * state.speed * dt
    if (Math.hypot(x, z) < WORLD_RADIUS - 3) { state.x = x; state.z = z }
    else state.heading = Math.atan2(-state.x, -state.z)
    state.y = Math.max(state.y, heightAt(state.x, state.z) + (state.phase === 'landing' ? 0 : .05))
    return
  }
  const topSpeed = state.id === 'plane' ? 8 : definition.topSpeed * (boost ? 1.3 : 1)
  state.speed = approach(state.speed, throttle * topSpeed * (throttle < 0 ? .4 : 1), throttle ? 1.8 : 4.5, dt)
  // Positive Y yaw turns a +Z-facing model left. Right input therefore
  // subtracts yaw; reversing changes yaw direction, as with real steering.
  state.heading -= steer * dt * (state.id === 'boat' ? .9 : 1.7) * Math.min(Math.abs(state.speed) / 2, 1) * (state.speed < 0 ? -1 : 1)
  moveGround(state, state.speed * dt, colliders)
  if (state.id !== 'plane') state.phase = Math.abs(state.speed) > .1 ? 'driving' : 'parked'
}

/** The boat is boarded from its dock, not by trying to walk into the sea. */
export function boardingPoint(state: VehicleState): Point {
  if (state.id === 'boat') return { x: state.x, z: Math.min(state.z, shoreline(state.x) - 3) }
  if (state.id === 'rocket') return { x: state.x + 3, z: state.z + 3 }
  return { x: state.x + Math.cos(state.heading) * 2.2, z: state.z - Math.sin(state.heading) * 2.2 }
}

export function exitPoint(state: VehicleState, colliders: readonly Collider[]): Point | null {
  if ((state.id === 'plane' || state.id === 'rocket') && state.phase !== 'parked') return null
  const start = state.id === 'boat' ? 4 : vehicleDefinition(state.id).radius + .8
  for (let radius = start; radius <= (state.id === 'boat' ? 8 : start + 3); radius += .7) {
    for (let i = 0; i < 16; i++) {
      const angle = state.heading + Math.PI / 2 + i * Math.PI / 8
      const x = state.x + Math.sin(angle) * radius, z = state.z + Math.cos(angle) * radius
      if (isWalkable(x, z, colliders, .4)) return { x, z }
    }
  }
  return null
}

export function vehicleStatus(state: VehicleState, colliders: readonly Collider[]): VehicleStatus {
  return { id: state.id, name: vehicleDefinition(state.id).name, speed: Math.round(Math.abs(state.speed) * 3.6), altitude: Math.max(0, Math.round(state.y - heightAt(state.x, state.z))), phase: state.phase,
    action: state.id === 'rocket' ? state.phase === 'parked' ? 'Launch' : state.phase === 'landing' ? null : 'Land vertically' : state.id === 'plane' ? state.phase === 'parked' ? 'Take off' : state.phase === 'returning' || state.phase === 'landing' ? 'Resume flight' : 'Return & land' : null,
    canExit: Boolean(exitPoint(state, colliders)) }
}
