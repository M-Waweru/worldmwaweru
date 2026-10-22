import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { parse } from 'yaml'
import { validateEditableContent } from '../scripts/content-pipeline.mjs'

const root = new URL('../', import.meta.url)
const config = parse(readFileSync(new URL('.pages.yml', root), 'utf8'))
const documents = Object.fromEntries(config.content.map(entry => [entry.path, JSON.parse(readFileSync(new URL(entry.path, root), 'utf8'))]))
const garden = JSON.parse(readFileSync(new URL('src/generated/garden-manifest.json', root), 'utf8'))
const options = { mediaExists: path => existsSync(new URL(`public${path}`, root)), essaySlugs: new Set(garden.essays.map(note => note.slug)) }

test('every configured CMS file, field, preview, and recommendation is valid', () => {
  assert.equal(config.content.length, 5)
  assert.deepEqual(validateEditableContent(config, documents, options), [])
})

test('copy and biography can be edited without changing application code', () => {
  const edited = structuredClone(documents)
  edited['content/site.json'].welcomeIntro = 'A new welcome from the homestead.'
  edited['content/profile.json'].currentFocus = 'A new focus for this season.'
  edited['content/profile.json'].biography.push('Another chapter worth sharing.')
  edited['content/people.json'].people[0].dialogue = ['A new conversation.', 'A second thought.']
  assert.deepEqual(validateEditableContent(config, edited, options), [])
})

test('broken editorial references are reported with actionable field names', () => {
  const edited = structuredClone(documents)
  edited['content/people.json'].people[0].essaySlug = 'A note that does not exist'
  edited['content/projects.json'].projects[1].preview = '/assets/missing-preview.webp'
  edited['content/elsewhere.json'].links[0].url = 'javascript:alert(1)'
  const errors = validateEditableContent(config, edited, options)
  assert.ok(errors.some(error => error.includes('essaySlug')))
  assert.ok(errors.some(error => error.includes('missing-preview.webp')))
  assert.ok(errors.some(error => error.includes('elsewhere.linkedin.url')))
})

test('Mathnuscripts remains the lead visual project, with a complete summary and local-reading action', () => {
  const project = documents['content/projects.json'].projects[0]
  assert.equal(project.id, 'mathnuscripts')
  assert.ok(project.preview && project.previewAlt)
  assert.ok(project.description.length > 150)
  assert.match(project.action, /here/)
})
