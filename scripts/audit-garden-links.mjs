import { readFileSync, writeFileSync } from 'node:fs'
import { publishedPathFor, publishedUrlFor } from '../src/game/published-links.mjs'

const path = new URL('../src/generated/garden-manifest.json', import.meta.url)
const manifest = JSON.parse(readFileSync(path, 'utf8'))
const response = await fetch('https://mathnuscript.com/static/contentIndex.json', { signal: AbortSignal.timeout(20000) })
if (!response.ok) throw new Error(`Could not load the published route index: HTTP ${response.status}`)
const index = await response.json()
const results = manifest.essays.map((entry) => ({
  slug: entry.slug,
  path: publishedPathFor(entry.sourcePath),
  url: publishedUrlFor(entry.sourcePath),
  registered: Object.hasOwn(index, publishedPathFor(entry.sourcePath)),
  status: null,
}))
let cursor = 0
await Promise.all(Array.from({ length: 5 }, async () => {
  while (cursor < results.length) {
    const entry = results[cursor++]
    if (!entry.registered) continue
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const page = await fetch(entry.url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) })
        entry.status = page.status
        if (page.ok || page.status < 500) break
      } catch { entry.status = 'request-failed' }
    }
  }
}))
const invalid = results.filter((entry) => !entry.registered || typeof entry.status !== 'number' || entry.status >= 400)
if (invalid.length) {
  console.error(JSON.stringify({ checked: results.length, invalid }, null, 2))
  process.exitCode = 1
} else {
  if (process.argv.includes('--fix')) {
    const bySlug = new Map(results.map((entry) => [entry.slug, entry.url]))
    manifest.essays = manifest.essays.map((entry) => ({ ...entry, url: bySlug.get(entry.slug) }))
    writeFileSync(path, JSON.stringify(manifest, null, 2))
  }
  console.log(JSON.stringify({ checked: results.length, registered: results.filter((entry) => entry.registered).length, httpOk: results.length - invalid.length, updated: process.argv.includes('--fix'), example: results.find((entry) => entry.slug === 'Choosing your Game will Choose Your Life') }, null, 2))
}
