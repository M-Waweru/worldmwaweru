import { readFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { validateEditableContent } from './content-pipeline.mjs'

const root = new URL('../', import.meta.url)
const config = parse(await readFile(new URL('.pages.yml', root), 'utf8'))
const documents = {}
for (const entry of config.content) {
  if (!/^content\/[a-z-]+\.json$/.test(entry.path)) throw new Error(`Unsupported CMS content path: ${entry.path}`)
  documents[entry.path] = JSON.parse(await readFile(new URL(entry.path, root), 'utf8'))
}
const garden = JSON.parse(await readFile(new URL('src/generated/garden-manifest.json', root), 'utf8'))
const media = new Set()
async function images(value) {
  if (typeof value === 'string' && value.startsWith('/assets/') && !value.split('/').includes('..')) {
    try { await access(fileURLToPath(new URL(`public${value}`, root))); media.add(value) } catch { /* The validator names the missing image. */ }
  } else if (Array.isArray(value)) await Promise.all(value.map(images))
  else if (value && typeof value === 'object') await Promise.all(Object.values(value).map(images))
}
await images(documents)
const errors = validateEditableContent(config, documents, { mediaExists: path => media.has(path), essaySlugs: new Set(garden.essays.map(essay => essay.slug)) })
if (errors.length) { console.error(`Editable content needs attention:\n${errors.map(error => `- ${error}`).join('\n')}`); process.exitCode = 1 }
else console.log(`Validated ${config.content.length} Pages CMS content files, ${documents['content/projects.json'].projects.length} workshop projects, and ${documents['content/people.json'].people.length} resident conversations.`)
