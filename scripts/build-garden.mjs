import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { publishedUrlFor } from '../src/game/published-links.mjs'

export const ALLOWED_FOLDERS = ['Content/Essays', 'Content/Notes', 'Fleeting Notes']
const READING_WORDS_PER_MINUTE = 200

export function parseFrontmatter(content) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content)
  if (!match) return { frontmatter: {}, body: content }
  const frontmatter = {}
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line)
    if (pair) frontmatter[pair[1].trim()] = pair[2].trim()
  }
  return { frontmatter, body: content.slice(match[0].length) }
}

export function extractTitle(body, filename) {
  const heading = /^#\s+(.+)$/m.exec(body)
  return (heading ? heading[1].trim() : filename) || filename
}

export function extractWikiLinks(body) {
  const links = []
  const pattern = /\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g
  let match
  while ((match = pattern.exec(body))) links.push(match[1].trim())
  return links
}

export function slugFor(filename) {
  return filename.replace(/\.md$/i, '')
}

export function isEligible(relativePath, frontmatter) {
  const folder = relativePath.includes('/') ? relativePath.slice(0, relativePath.lastIndexOf('/')) : ''
  if (!ALLOWED_FOLDERS.includes(folder)) return { eligible: false, reason: 'folder-not-allowlisted' }
  if (frontmatter['dg-publish'] !== 'true') return { eligible: false, reason: 'not-flagged-publish' }
  return { eligible: true, reason: 'ok' }
}

export function collectEssays(files, overrides = {}, now = new Date().toISOString()) {
  const bySlug = new Map()
  const entries = []
  const errors = []
  const excluded = []
  for (const file of files) {
    try {
      const { frontmatter, body } = parseFrontmatter(file.content)
      const eligibility = isEligible(file.relativePath, frontmatter)
      if (!eligibility.eligible) {
        excluded.push({ path: file.path, reason: eligibility.reason })
        continue
      }
      const filename = file.path.split('/').pop()
      const slug = slugFor(filename)
      if (bySlug.has(slug)) {
        errors.push({ path: file.path, error: `duplicate slug "${slug}" also at ${bySlug.get(slug)}` })
        continue
      }
      bySlug.set(slug, file.path)
      entries.push({ file, slug, frontmatter, body, filename })
    } catch (error) {
      errors.push({ path: file.path, error: String(error) })
    }
  }
  const linkTargets = new Set(entries.map((entry) => entry.slug))
  const essays = entries.map(({ file, slug, frontmatter, body, filename }) => {
    const title = extractTitle(body, filename)
    const words = body.split(/\s+/).filter(Boolean).length
    const override = overrides[slug] ?? {}
    const links = [...new Set(extractWikiLinks(body))]
      .map((name) => slugFor(name))
      .filter((target) => linkTargets.has(target) && target !== slug)
    return {
      slug,
      title,
      territory: override.territory ?? 'nursery',
      arc: override.arc ?? null,
      status: override.status ?? 'seed',
      summary: override.summary ?? '',
      readingTime: Math.max(1, Math.round(words / READING_WORDS_PER_MINUTE)),
      links,
      component: override.component ?? null,
      placement: override.placement ?? null,
      url: publishedUrlFor(file.relativePath),
      sourcePath: relative(file.root, file.path).split('\\').join('/'),
      words,
    }
  })
  essays.sort((a, b) => a.slug.localeCompare(b.slug))
  const fingerprint = createHash('sha256')
    .update(entries.map((entry) => `${entry.slug}:${entry.words}`).join('|'))
    .digest('hex')
    .slice(0, 12)
  return {
    manifest: {
      generatedAt: now,
      fingerprint,
      counts: {
        eligible: essays.length,
        excludedNotFlagged: excluded.filter((item) => item.reason === 'not-flagged-publish').length,
        excludedDisallowedFolder: excluded.filter((item) => item.reason === 'folder-not-allowlisted').length,
        errors: errors.length,
      },
      essays,
    },
    report: { excluded, errors },
  }
}

export function walkVault(vaultPath, allowedFolders) {
  const files = []
  const walk = (current) => {
    for (const name of readdirSync(current)) {
      const full = join(current, name)
      if (statSync(full).isDirectory()) {
        walk(full)
        continue
      }
      if (!name.endsWith('.md')) continue
      const relativePath = relative(vaultPath, full).split('\\').join('/')
      const folder = relativePath.includes('/') ? relativePath.slice(0, relativePath.lastIndexOf('/')) : ''
      if (!allowedFolders.includes(folder)) continue
      files.push({ root: vaultPath, path: full, relativePath, content: readFileSync(full, 'utf8') })
    }
  }
  for (const folder of allowedFolders) {
    const full = join(vaultPath, folder)
    walk(full)
  }
  return files
}

export function run(vaultPath = process.env.VAULT_PATH ?? '/mnt/d/Obsidian/Mathnuscripts', { ifAvailable = false } = {}) {
  // A production build can use the published snapshot without the author's local vault.
  // Explicit garden exports still fail on a missing vault so a typo cannot go unnoticed.
  if (ifAvailable && !existsSync(vaultPath) && !process.env.VAULT_PATH) {
    const bundled = JSON.parse(readFileSync(new URL('../src/generated/garden-manifest.json', import.meta.url), 'utf8'))
    if (!Array.isArray(bundled.essays) || bundled.essays.length === 0) throw new Error('No published notes are available. Run npm run garden with VAULT_PATH set.')
    console.log(`Using the bundled garden manifest: ${bundled.essays.length} published notes (local vault unavailable).`)
    return bundled
  }
  const overridesPath = new URL('../content/garden-overrides.json', import.meta.url)
  const overrides = JSON.parse(readFileSync(overridesPath, 'utf8'))
  const { manifest, report } = collectEssays(walkVault(vaultPath, ALLOWED_FOLDERS), overrides)
  const outDir = new URL('../src/generated/', import.meta.url)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(new URL('garden-manifest.json', outDir), JSON.stringify(manifest, null, 2))
  const lines = [
    `Garden manifest: ${manifest.counts.eligible} essays included (fingerprint ${manifest.fingerprint})`,
    `  excluded (not flagged dg-publish): ${manifest.counts.excludedNotFlagged}`,
    `  excluded (folder not allowlisted): ${manifest.counts.excludedDisallowedFolder}`,
    `  unclassified (default seed / nursery): ${manifest.essays.filter((essay) => essay.territory === 'nursery').length}`,
    `  errors: ${manifest.counts.errors}`,
  ]
  for (const error of report.errors) lines.push(`  ERROR ${error.path}: ${error.error}`)
  console.log(lines.join('\n'))
  return manifest
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('build-garden.mjs')) {
  run(undefined, { ifAvailable: process.argv.includes('--if-available') })
}
