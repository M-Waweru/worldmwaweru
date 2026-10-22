/** Shared by rendering, fixed-step motion, and navigation. Coordinates are metres. */
export type Point = { x: number; z: number }
export type Collider = { kind: 'box'; x: number; z: number; w: number; d: number } | { kind: 'circle'; x: number; z: number; r: number }
export type CharacterState = Point & { y: number; vx: number; vz: number; vy: number; grounded: boolean }

export const WORLD_RADIUS = 132
export const BRIDGES = [-14, 4, 22]
export const PLAYER_RADIUS = 0.32
export const FIXED_STEP = 1 / 60

export function smooth(a: number, b: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
export function riverX(z: number) { return -8 + Math.sin(z * 0.105) * 2.5 }
export function shoreline(x: number) { return 35 + Math.sin(x * 0.12) * 2 }

const pads = [
  [0, 5, 6, 1.2], [-20, -22, 6, 2.1], [22, -5, 6, 1.3],
  [-26, 3, 6, 1.2], [16, 24, 6, 1.0], [23, -30, 6, 5.5],
]

export function heightAt(x: number, z: number) {
  let h = 1.2 + Math.sin(x * 0.12) * Math.cos(z * 0.14) * 0.23
  h += 4.8 * Math.exp(-((x - 23) ** 2 + (z + 30) ** 2) / 350)
  h += 1.1 * Math.exp(-((x + 22) ** 2 + (z + 23) ** 2) / 240)
  for (const [px, pz, radius, y] of pads) {
    const influence = 1 - smooth(radius, radius + 3, Math.hypot(x - px, z - pz))
    h += (y - h) * influence
  }
  // The western airstrip and eastern launch field are level clearings in the
  // expanded countryside; the original garden's terrain remains continuous.
  const airstrip = (1 - smooth(5, 9, Math.abs(x + 62))) * (1 - smooth(30, 35, Math.abs(z + 54)))
  h += (1.3 - h) * airstrip
  const launchpad = 1 - smooth(10, 17, Math.hypot(x - 61, z + 61))
  h += (1.5 - h) * launchpad
  const coast = 1 - smooth(shoreline(x) - 5, shoreline(x) + 2, z)
  h = -0.6 + (h + 0.6) * coast
  if (z > -32 && z < shoreline(x)) {
    const distance = Math.abs(x - riverX(z))
    const river = 1 - smooth(1.05, 2.7, distance)
    h += (0.12 - h) * river
    if (BRIDGES.some((bridge) => Math.abs(z - bridge) < 1.8) && distance < 3.6) h = 1.35
  }
  return h
}

export function snowAt(x: number, z: number) {
  return smooth(2.9, 5.0, heightAt(x, z)) * smooth(-13, -25, z)
}

export function isWalkable(x: number, z: number, colliders: readonly Collider[] = [], radius = PLAYER_RADIUS) {
  if (Math.hypot(x, z) > WORLD_RADIUS - radius || z > shoreline(x) - 1.5) return false
  const riverDistance = Math.abs(x - riverX(z))
  if (z > -32 && z < 33 && riverDistance < 1.55 + radius && !BRIDGES.some((bridge) => Math.abs(z - bridge) < 1.75 - radius)) return false
  for (const object of colliders) {
    if (object.kind === 'circle') {
      if ((x - object.x) ** 2 + (z - object.z) ** 2 < (object.r + radius) ** 2) return false
    } else if (Math.abs(x - object.x) < object.w / 2 + radius && Math.abs(z - object.z) < object.d / 2 + radius) return false
  }
  return true
}

export function canWalkLine(from: Point, to: Point, colliders: readonly Collider[]) {
  const distance = Math.hypot(to.x - from.x, to.z - from.z)
  const samples = Math.max(1, Math.ceil(distance / 0.2))
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    if (!isWalkable(from.x + (to.x - from.x) * t, from.z + (to.z - from.z) * t, colliders)) return false
  }
  return true
}

/** Sliding movement uses the same simplified footprints as click/tap navigation. */
export function stepCharacter(state: CharacterState, input: Point, dt: number, colliders: readonly Collider[], run = false, jump = false, followingPath = false) {
  const length = Math.hypot(input.x, input.z)
  const normalization = Math.max(1, length)
  const speed = run ? 7.2 : 4.1
  const response = 1 - Math.exp(-dt * (length > 0.01 ? followingPath ? 24 : 12 : 18))
  state.vx += (input.x / normalization * speed - state.vx) * response
  state.vz += (input.z / normalization * speed - state.vz) * response
  const nx = state.x + state.vx * dt, nz = state.z + state.vz * dt
  if (isWalkable(nx, nz, colliders)) { state.x = nx; state.z = nz }
  else {
    if (isWalkable(nx, state.z, colliders)) state.x = nx
    else state.vx = 0
    if (isWalkable(state.x, nz, colliders)) state.z = nz
    else state.vz = 0
  }
  const floor = heightAt(state.x, state.z)
  if (jump && state.grounded) { state.vy = 5; state.grounded = false }
  if (!state.grounded) { state.vy -= 15 * dt; state.y += state.vy * dt }
  if (state.grounded || state.y <= floor) { state.y = floor; state.vy = 0; state.grounded = true }
  if (!Number.isFinite(state.x + state.z + state.y) || state.y < -10) {
    Object.assign(state, { x: 2, z: 12, y: heightAt(2, 12), vx: 0, vz: 0, vy: 0, grounded: true })
  }
}

/** A* on a small walkability grid; diagonal corner-cutting is forbidden. */
export function findPath(from: Point, requested: Point, colliders: readonly Collider[]): Point[] {
  const spacing = 1.25
  const key = (x: number, z: number) => `${x},${z}`
  const cell = (point: Point) => ({ x: Math.round(point.x / spacing), z: Math.round(point.z / spacing) })
  const world = (point: Point) => ({ x: point.x * spacing, z: point.z * spacing })
  let target = { ...requested }
  if (!isWalkable(target.x, target.z, colliders)) {
    let found = false
    for (let radius = 0.8; radius <= 6 && !found; radius += 0.8) for (let i = 0; i < 16 && !found; i++) {
      const angle = i * Math.PI / 8
      const candidate = { x: requested.x + Math.cos(angle) * radius, z: requested.z + Math.sin(angle) * radius }
      if (isWalkable(candidate.x, candidate.z, colliders)) { target = candidate; found = true }
    }
    if (!found) return []
  }
  if (canWalkLine(from, target, colliders)) return [target]
  const start = cell(from), end = cell(target)
  type Node = Point & { g: number; f: number; parent: Node | null }
  const open: Node[] = []
  const push = (node: Node) => {
    open.push(node)
    let i = open.length - 1
    while (i > 0) { const parent = (i - 1) >> 1; if (open[parent].f <= node.f) break; open[i] = open[parent]; i = parent }
    open[i] = node
  }
  const pop = () => {
    const top = open[0], last = open.pop()!
    if (open.length) {
      let i = 0
      while (i * 2 + 1 < open.length) {
        let child = i * 2 + 1
        if (child + 1 < open.length && open[child + 1].f < open[child].f) child++
        if (open[child].f >= last.f) break
        open[i] = open[child]; i = child
      }
      open[i] = last
    }
    return top
  }
  const costs = new Map<string, number>()
  const closed = new Set<string>()
  push({ ...start, g: 0, f: 0, parent: null })
  costs.set(key(start.x, start.z), 0)
  let result: Node | null = null, visited = 0
  while (open.length && visited++ < 12000) {
    const current = pop(), currentKey = key(current.x, current.z)
    if (closed.has(currentKey)) continue
    closed.add(currentKey)
    if (Math.hypot(current.x - end.x, current.z - end.z) <= 1 && canWalkLine(world(current), target, colliders)) { result = current; break }
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dz) continue
      const x = current.x + dx, z = current.z + dz, nextKey = key(x, z)
      if (closed.has(nextKey) || !isWalkable(x * spacing, z * spacing, colliders)) continue
      if (!canWalkLine(world(current), { x: x * spacing, z: z * spacing }, colliders)) continue
      const g = current.g + Math.hypot(dx, dz)
      if (g >= (costs.get(nextKey) ?? Infinity)) continue
      costs.set(nextKey, g)
      push({ x, z, g, f: g + Math.hypot(x - end.x, z - end.z), parent: current })
    }
  }
  if (!result) return []
  const raw: Point[] = [target]
  for (let node: Node | null = result; node; node = node.parent) raw.push(world(node))
  raw.reverse()
  raw[0] = from
  const simplified: Point[] = []
  let i = 0
  while (i < raw.length - 1) {
    let next = Math.min(i + 18, raw.length - 1)
    while (next > i + 1 && !canWalkLine(raw[i], raw[next], colliders)) next--
    simplified.push(raw[next]); i = next
  }
  return simplified
}
