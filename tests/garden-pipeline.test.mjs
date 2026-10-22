import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { parseFrontmatter, extractWikiLinks, isEligible, collectEssays, slugFor, ALLOWED_FOLDERS, run } from '../scripts/build-garden.mjs'
import { publishedUrlFor } from '../src/game/published-links.mjs'

const file = (path, content) => ({ root: '/vault', path: `/vault/${path}`, relativePath: path, content })

const essay = (path, body = '# Title\n\nSome words.', frontmatter = 'dg-publish: true') =>
  file(path, `---\n${frontmatter}\n---\n${body}`)

test('frontmatter parsing extracts flags and body', () => {
  const { frontmatter, body } = parseFrontmatter('---\ndg-publish: true\nstatus: seed\n---\n# Hello')
  assert.equal(frontmatter['dg-publish'], 'true')
  assert.equal(frontmatter.status, 'seed')
  assert.match(body, /# Hello/)
})

test('essays require both allowlisted folder and dg-publish flag', () => {
  assert.equal(isEligible('Content/Essays/A.md', { 'dg-publish': 'true' }).eligible, true)
  assert.equal(isEligible('Content/Essays/A.md', {}).reason, 'not-flagged-publish')
  assert.equal(isEligible('Clippings/B.md', { 'dg-publish': 'true' }).reason, 'folder-not-allowlisted')
  assert.equal(isEligible('Introspection/C.md', { 'dg-publish': 'true' }).reason, 'folder-not-allowlisted')
})

test('copyrighted Clippings can never enter the manifest', () => {
  const { manifest } = collectEssays([
    essay('Clippings/Daniel Miessler article.md'),
    essay('Content/Essays/Real Essay.md'),
  ])
  assert.equal(manifest.essays.length, 1)
  assert.equal(manifest.essays[0].slug, 'Real Essay')
})

test('wiki links resolve only to published essays and never to self', () => {
  const { manifest } = collectEssays([
    essay('Content/Essays/Alpha.md', '# Alpha\n\nSee [[Beta]] and [[Gamma]] and [[Alpha]] and [[Unpublished]]'),
    essay('Content/Essays/Beta.md'),
    essay('Content/Notes/Gamma.md'),
    essay('Content/Notes/Unpublished.md', '# Unpublished', 'dg-publish: false'),
  ])
  const alpha = manifest.essays.find((entry) => entry.slug === 'Alpha')
  assert.deepEqual(alpha.links.sort(), ['Beta', 'Gamma'])
})

test('unclassified essays default to seed status in the nursery', () => {
  const { manifest } = collectEssays([essay('Content/Essays/Unknown.md')])
  const entry = manifest.essays[0]
  assert.equal(entry.territory, 'nursery')
  assert.equal(entry.status, 'seed')
  assert.equal(entry.placement, null)
})

test('overrides supply territory, arc, status, summary and placement', () => {
  const { manifest } = collectEssays(
    [essay('Content/Essays/Alpha.md')],
    { Alpha: { territory: 'africa', arc: 'origins', status: 'evergreen', summary: 'A seed summary.', placement: { x: 1, z: 2 } } },
  )
  const entry = manifest.essays[0]
  assert.equal(entry.territory, 'africa')
  assert.equal(entry.arc, 'origins')
  assert.equal(entry.status, 'evergreen')
  assert.deepEqual(entry.placement, { x: 1, z: 2 })
  assert.equal(entry.summary, 'A seed summary.')
})

test('slugs are stable and derived from filenames', () => {
  assert.equal(slugFor('Knowledge, Innovation and Africa.md'), 'Knowledge, Innovation and Africa')
})

test('published essay URLs use the live folder path rather than the note title', () => {
  const { manifest } = collectEssays([essay('Content/Essays/Choosing your Game will Choose Your Life.md')])
  assert.equal(manifest.essays[0].url, 'https://mathnuscript.com/content/essays/choosing-your-game-will-choose-your-life')
  assert.equal(manifest.essays[0].slug, 'Choosing your Game will Choose Your Life')
})

test('note and fleeting-note routes retain their actual source folders', () => {
  assert.equal(publishedUrlFor('Content/Notes/Future of Personal Computing.md'), 'https://mathnuscript.com/content/notes/future-of-personal-computing')
  assert.equal(publishedUrlFor('Fleeting Notes/Publishing My Second Brain.md'), 'https://mathnuscript.com/fleeting-notes/publishing-my-second-brain')
})

test('published URLs preserve punctuation and safely encode path segments', () => {
  assert.equal(publishedUrlFor('Content/Essays/Knowledge, Innovation and Africa.md'), 'https://mathnuscript.com/content/essays/knowledge%2C-innovation-and-africa')
  assert.equal(publishedUrlFor('Content\\Notes\\Naval\'s Important Skills to Have.md'), "https://mathnuscript.com/content/notes/naval's-important-skills-to-have")
})

test('duplicate slugs produce errors, not silent loss', () => {
  const { manifest, report } = collectEssays([
    essay('Content/Essays/Dup.md'),
    essay('Content/Notes/Dup.md'),
  ])
  assert.equal(manifest.counts.errors, 1)
  assert.equal(report.errors[0].error.includes('duplicate slug'), true)
})

test('reading time is derived from word count', () => {
  const long = '# Long\n\n' + Array(600).fill('word').join(' ')
  const { manifest } = collectEssays([essay('Content/Essays/Long.md', long)])
  assert.equal(manifest.essays[0].readingTime, 3)
})

test('manifest never contains the absolute vault path', () => {
  const { manifest } = collectEssays([essay('Content/Essays/X.md')])
  const serialized = JSON.stringify(manifest)
  assert.equal(serialized.includes('/vault'), false)
  assert.equal(serialized.includes('/mnt/'), false)
})

test('manifest is stable for identical input', () => {
  const files = [essay('Content/Essays/Alpha.md'), essay('Content/Essays/Beta.md')]
  const a = collectEssays(files, {}, '2026-01-01').manifest.fingerprint
  const b = collectEssays(files, {}, '2026-01-01').manifest.fingerprint
  assert.equal(a, b)
})

test('allowlist covers exactly the intended folders', () => {
  assert.deepEqual(ALLOWED_FOLDERS, ['Content/Essays', 'Content/Notes', 'Fleeting Notes'])
})

test('building without the local vault preserves the published snapshot', () => {
  const snapshot = new URL('../src/generated/garden-manifest.json', import.meta.url)
  const before = readFileSync(snapshot, 'utf8')
  const env = { ...process.env }
  delete env.VAULT_PATH
  const script = new URL('../scripts/build-garden.mjs', import.meta.url).href
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `import { run } from ${JSON.stringify(script)}; const manifest = run('/nonexistent-little-world-vault', { ifAvailable: true }); if (!manifest.essays.length) process.exit(1);`], { env, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /bundled garden manifest/)
  assert.equal(readFileSync(snapshot, 'utf8'), before)
})

test('an explicit garden export still rejects a missing vault', () => {
  assert.throws(() => run('/nonexistent-little-world-vault'), /ENOENT/)
})
