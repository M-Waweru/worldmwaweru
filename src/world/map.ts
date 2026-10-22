import type { Arc, GardenEntry, Territory } from '../game/essays'

export type DistrictId = Exclude<Territory, 'nursery'>
export type District = { id: DistrictId; name: string; short: string; landmark: string; description: string; center: [number, number]; entrance: [number, number]; color: string }
export const districts: District[] = [
  { id: 'trailhead', name: 'The Trailhead', short: 'Trailhead', landmark: 'The homestead', description: 'Where every journey begins.', center: [0, 5], entrance: [2, 12], color: '#697f46' },
  { id: 'computing', name: 'Technology & Computing', short: 'Computing', landmark: 'The glass pavilion', description: 'Software, intelligence, and the tools for thought.', center: [-20, -22], entrance: [-18, -15], color: '#577d80' },
  { id: 'building', name: 'Building & Innovation', short: 'Building', landmark: 'The workshop', description: 'Ideas become clearer at the workbench.', center: [22, -5], entrance: [21, 2], color: '#a47950' },
  { id: 'knowledge', name: 'Knowledge & Writing', short: 'Knowledge', landmark: 'The archive', description: 'Follow a link. Chase a question.', center: [-26, 3], entrance: [-24, 10], color: '#4e7955' },
  { id: 'africa', name: 'Africa & Development', short: 'Africa', landmark: 'The waterfront', description: 'A continent that creates, not merely consumes.', center: [16, 24], entrance: [14, 29], color: '#4e8e85' },
  { id: 'philosophy', name: 'Philosophy & Life', short: 'Philosophy', landmark: 'The highland retreat', description: 'A little space for the slow work of becoming.', center: [23, -30], entrance: [21, -23], color: '#7d94a0' },
]
export const districtById = (id: DistrictId) => districts.find((district) => district.id === id)!
export const trails: [number, number][][] = [
  [[2, 12], [-2, 7], [-4, 4], [-12, 4], [-17, 10], [-24, 10]],
  [[-12, 4], [-15, -4], [-12, -14], [-18, -15]],
  [[2, 12], [11, 12], [17, 9], [21, 2]],
  [[2, 12], [12, 17], [14, 29]],
  [[21, 2], [30, -7], [32, -15], [28, -22], [21, -23]],
]
export const countryRoads: [number, number][][] = [
  [[13, 10], [37, 10], [49, -12], [61, -38], [61, -61]],
  [[61, -61], [28, -64], [-10, -61], [-39, -65], [-62, -65]],
  [[-62, -65], [-69, -38], [-56, -5], [-42, 15], [-24, 10]],
  [[61, -61], [86, -30], [85, 4], [57, 23], [37, 10]],
]
export const arcs: { id: Arc; name: string; description: string }[] = [
  { id: 'origins', name: 'Origins', description: 'Begin with the questions that made this garden.' },
  { id: 'wanderer', name: 'Wanderer', description: 'Follow curiosity into unfamiliar ground.' },
  { id: 'maker', name: 'Maker', description: 'Move from thinking to making.' },
  { id: 'sovereign', name: 'Sovereign', description: 'Choose what to build, and what to become.' },
]

export type GardenPlant = { slug: string; title: string; status: GardenEntry['status']; territory: Territory; x: number; z: number }
const originalCenters: Record<string, [number, number]> = { computing: [-16, -14], building: [17, -10], knowledge: [-20, 8], africa: [6, -22], philosophy: [18, 10] }

/** Stable per-note placement, independent of JSON order and Three.js. */
export function placeEntries(entries: GardenEntry[]): GardenPlant[] {
  const countByTerritory = new Map<string, number>()
  const result: GardenPlant[] = []
  const sorted = entries.slice().sort((a, b) => a.slug.localeCompare(b.slug))
  for (const entry of sorted) {
    const index = countByTerritory.get(entry.territory) ?? 0
    countByTerritory.set(entry.territory, index + 1)
    let x: number, z: number
    const district = districts.find((item) => item.id === entry.territory)
    if (entry.territory === 'nursery' || !district) {
      const row = Math.floor(index / 14), col = index % 14
      x = -1 + col * 0.75; z = 17 + row * 0.8
    } else if (entry.placement && originalCenters[entry.territory]) {
      const original = originalCenters[entry.territory]
      x = district.center[0] + (entry.placement.x - original[0]) * 1.8 - 7
      z = district.center[1] + (entry.placement.z - original[1]) * 1.8 + 7
    } else {
      const angle = index * 2.39996
      const r = 8 + Math.sqrt(index) * 1.3
      x = district.center[0] + Math.cos(angle) * r
      z = district.center[1] + Math.sin(angle) * r
    }
    result.push({ slug: entry.slug, title: entry.title, status: entry.status, territory: entry.territory, x, z })
  }
  return result
}
