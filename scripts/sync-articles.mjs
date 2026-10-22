import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractArticle, articleId, rewriteArticleAssets } from './article-pipeline.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const manifest = JSON.parse(await readFile(path.join(root, 'src/generated/garden-manifest.json'), 'utf8'))
const output = path.join(root, 'public/articles')
const publicBuild = process.env.QUARTZ_PUBLIC_DIR ? path.resolve(process.env.QUARTZ_PUBLIC_DIR) : null
await mkdir(path.join(output, 'media'), { recursive: true })
const imported = [], failures = [], media = new Map(), mediaTasks = new Map(), unavailableMedia = new Set()
const hash = data => createHash('sha256').update(data).digest('hex')
let localPages = 0, remotePages = 0

function localFile(url) {
  if (!publicBuild) return null
  const candidate = path.resolve(publicBuild, `.${decodeURIComponent(new URL(url).pathname)}`)
  return candidate.startsWith(publicBuild + path.sep) ? candidate : null
}
async function request(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
  return Buffer.from(await response.arrayBuffer())
}
async function pageSource(entry) {
  const filename = localFile(entry.url)
  if (filename) for (const candidate of [`${filename}.html`, path.join(filename, 'index.html')]) {
    try { const text = await readFile(candidate, 'utf8'); localPages++; return text } catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error }
  }
  const text = await request(entry.url); remotePages++; return text.toString('utf8')
}
async function importMedia(url) {
  if (mediaTasks.has(url)) return mediaTasks.get(url)
  const task = (async () => {
    try {
      let bytes
      const filename = localFile(url)
      if (filename) { try { bytes = await readFile(filename) } catch {} }
      if (!bytes) bytes = await request(url)
      if (bytes.length > 10 * 1024 * 1024) return
      const extension = path.extname(new URL(url).pathname).toLowerCase()
      if (!/^\.(?:png|jpe?g|webp|gif|avif|svg|mp3|mp4|webm|ogg|wav|pdf)$/.test(extension)) return
      const file = `media/${hash(bytes).slice(0, 24)}${extension}`
      await writeFile(path.join(output, file), bytes)
      media.set(url, { path: `articles/${file}`, sourceUrl: url, bytes: bytes.length, sha256: hash(bytes) })
    } catch (error) {
      if (/HTTP (?:404|410):/.test(error.message)) { unavailableMedia.add(url); console.warn(`Published attachment unavailable: ${url}`) }
      else console.warn(`Media retained at original URL: ${url} (${error.message})`)
    }
  })()
  mediaTasks.set(url, task); return task
}
let cursor = 0
await Promise.all(Array.from({ length: 6 }, async () => {
  while (cursor < manifest.essays.length) {
    const entry = manifest.essays[cursor++]
    try {
      const article = extractArticle(await pageSource(entry), entry, manifest.essays)
      await Promise.all(article.assets.map(importMedia))
      const locations = new Map([...media].map(([url, record]) => [url, `__WORLD_BASE__/${record.path}`]))
      article.html = rewriteArticleAssets(article.html, locations, unavailableMedia)
      delete article.assets
      const bytes = Buffer.from(JSON.stringify(article))
      const file = `${articleId(entry.slug)}-${hash(bytes).slice(0, 12)}.json`
      await writeFile(path.join(output, file), bytes)
      imported.push({ slug: entry.slug, path: `articles/${file}`, sourceUrl: entry.url, words: article.words, readingTime: article.readingTime, publishedAt: article.publishedAt, sha256: hash(bytes) })
      if (imported.length % 25 === 0) console.log(`Imported ${imported.length}/${manifest.essays.length} complete articles`)
    } catch (error) { failures.push({ slug: entry.slug, sourceUrl: entry.url, error: error.message }) }
  }
}))
if (failures.length) { console.error(JSON.stringify({ imported: imported.length, failures }, null, 2)); process.exitCode = 1 }
else {
  const result = { schema: 1, generatedAt: new Date().toISOString(), sourceSite: 'https://mathnuscript.com', count: imported.length, articles: imported.sort((a, b) => a.slug.localeCompare(b.slug)) }
  await writeFile(path.join(root, 'src/generated/articles-manifest.json'), JSON.stringify(result, null, 2) + '\n')
  await writeFile(path.join(root, 'content/article-media.json'), JSON.stringify({ schema: 1, media: [...media.values()], unavailable: [...unavailableMedia].map(sourceUrl => ({ sourceUrl, reason: 'The published source returned HTTP 404 or 410.' })) }, null, 2) + '\n')
  const currentFiles = new Set(imported.map(article => path.basename(article.path)))
  for (const file of await readdir(output)) if (/^[a-f0-9]{16}-[a-f0-9]{12}\.json$/.test(file) && !currentFiles.has(file)) await unlink(path.join(output, file))
  console.log(JSON.stringify({ articles: imported.length, localPublishedPages: localPages, publicHTTPPages: remotePages, localMedia: media.size }))
}
