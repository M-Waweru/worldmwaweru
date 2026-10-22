import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const garden = JSON.parse(await readFile(path.join(root, 'src/generated/garden-manifest.json'), 'utf8'))
let manifest
try { manifest = JSON.parse(await readFile(path.join(root, 'src/generated/articles-manifest.json'), 'utf8')) }
catch { throw new Error('Local full-length articles are missing. Run npm run articles:sync before building.') }
const bySlug = new Map(manifest.articles.map(article => [article.slug, article]))
for (const entry of garden.essays) {
  const record = bySlug.get(entry.slug)
  if (!record) throw new Error(`Missing full article: ${entry.slug}. Run npm run articles:sync.`)
  const bytes = await readFile(path.join(root, 'public', record.path))
  if (createHash('sha256').update(bytes).digest('hex') !== record.sha256) throw new Error(`Article integrity mismatch: ${entry.slug}`)
  const article = JSON.parse(bytes)
  if (article.slug !== entry.slug || !article.html.trim() || !article.words) throw new Error(`Invalid full article: ${entry.slug}`)
}
console.log(`Verified ${garden.essays.length} complete local articles and their content digests.`)
