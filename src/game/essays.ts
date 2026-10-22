import manifest from '../generated/garden-manifest.json'
import { publishedUrlFor } from './published-links.mjs'
import articles from '../generated/articles-manifest.json'

export type GrowthStatus = 'seed' | 'budding' | 'evergreen'
export type Territory = 'trailhead' | 'computing' | 'building' | 'knowledge' | 'africa' | 'philosophy' | 'nursery'
export type Arc = 'origins' | 'wanderer' | 'maker' | 'sovereign'

export type GardenEntry = {
  slug: string
  title: string
  territory: Territory
  arc: Arc | null
  status: GrowthStatus
  summary: string
  readingTime: number
  links: string[]
  component: string | null
  placement: { x: number; z: number } | null
  url: string
  words: number
  sourcePath?: string
}

export type Essay = GardenEntry & { position: [number, number] }

export const manifestFingerprint = manifest.fingerprint

export function displayTitle(title: string) {
  return title
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target: string, label?: string) => label ?? target)
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(^|\s)[*_]([^*_]+)[*_](?=\s|$)/g, '$1$2')
}

export const gardenIndex: GardenEntry[] = (manifest.essays as GardenEntry[])
  .map((entry) => {
    const article = articles.articles.find(article => article.slug === entry.slug)
    return { ...entry, title: displayTitle(entry.title), words: article?.words ?? entry.words, readingTime: article?.readingTime ?? entry.readingTime, url: entry.sourcePath ? publishedUrlFor(entry.sourcePath) : entry.url }
  })
  .sort((a, b) => a.title.localeCompare(b.title))

export const essays: Essay[] = gardenIndex
  .filter((entry) => entry.placement)
  .map((entry) => ({ ...entry, position: [entry.placement!.x, entry.placement!.z] }))

export type Region = {
  id: Territory
  name: string
  blurb: string
  center: [number, number]
}

export const regions: Region[] = [
  { id: 'trailhead', name: 'The Trailhead', blurb: 'Where every walk through the garden begins.', center: [0, 6] },
  { id: 'computing', name: 'Computing & the Future', blurb: 'Software, intelligence, and what machines are becoming.', center: [-16, -14] },
  { id: 'building', name: 'Building & Innovation', blurb: 'Startups, product craft, and the discipline of making.', center: [17, -10] },
  { id: 'knowledge', name: 'Knowledge & Writing', blurb: 'Gardens, notes, and thinking in public.', center: [-20, 8] },
  { id: 'africa', name: 'Africa & Kenya', blurb: 'A continent that creates, not merely consumes.', center: [6, -22] },
  { id: 'philosophy', name: 'Philosophy & Life', blurb: 'Meaning, competence, and how to live well.', center: [18, 10] },
]

export function essayBySlug(slug: string) {
  return gardenIndex.find((entry) => entry.slug === slug) ?? null
}

export function titleForSlug(slug: string) {
  return essayBySlug(slug)?.title ?? slug
}

export const territoryNames: Record<Territory, string> = {
  trailhead: 'The Trailhead',
  computing: 'Computing & the Future',
  building: 'Building & Innovation',
  knowledge: 'Knowledge & Writing',
  africa: 'Africa & Kenya',
  philosophy: 'Philosophy & Life',
  nursery: 'New Growth',
}
