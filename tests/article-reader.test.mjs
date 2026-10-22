import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { extractArticle, sanitizeArticle, rewriteArticleAssets } from '../scripts/article-pipeline.mjs'

const entry = { slug: 'First note', title: 'First note', url: 'https://mathnuscript.com/content/essays/first-note' }
const other = { slug: 'Second note', title: 'Second note', url: 'https://mathnuscript.com/content/notes/second-note' }
const page = body => `<html><head><script>privateHeader()</script></head><body data-slug="content/essays/first-note"><nav>Not article content</nav><h1 class="article-title">First note</h1><article><div class="markdown-preview-view">${body}</div></article><footer>Not article content</footer></body></html>`

test('full published prose and structure are retained, not only the summary', () => {
  const article = extractArticle(page('<h1>First note</h1><p>Opening paragraph.</p><h2 id="idea">The idea</h2><p>The complete second paragraph.</p><ul><li>A supporting point.</li></ul><pre><code>const value = 42;</code></pre>'), entry, [entry, other])
  assert.ok(article.html.includes('The complete second paragraph.'))
  assert.ok(article.html.includes('<ul>'))
  assert.ok(article.html.includes('const value = 42;'))
  assert.ok(!article.html.includes('Not article content'))
  assert.ok(!article.html.includes('<h1>First note'))
  assert.deepEqual(article.toc, [{ id: 'idea', text: 'The idea', level: 2 }])
})

test('ordinary section headings are not removed as duplicate titles', () => {
  const article = extractArticle(page('<h1>A separate section</h1><p>Body text.</p>'), entry, [entry])
  assert.ok(article.html.includes('<h1>A separate section</h1>'))
})

test('links between imported notes stay on this website and local anchors remain usable', () => {
  const article = extractArticle(page('<p><a href="../notes/second-note">Read next</a> <a href="#section">Section</a> <a href="https://example.com/research">Reference</a></p>'), entry, [entry, other])
  assert.ok(article.html.includes('href="#essay/Second%20note"'))
  assert.ok(article.html.includes('data-essay-slug="Second note"'))
  assert.ok(article.html.includes('href="#section"'))
  assert.ok(article.html.includes('href="https://example.com/research"'))
  assert.ok(article.html.includes('rel="noopener noreferrer"'))
})

test('active content and dangerous links/styles cannot enter a full article', () => {
  const result = sanitizeArticle('<script>bad()</script><p onclick="bad()">Text <a href="javascript:bad()">link</a></p><img src="https://example.com/a.jpg" onerror="bad()"><span style="background:url(javascript:bad());height:1em">math</span><iframe src="https://example.com"></iframe>')
  assert.ok(!/onclick|onerror|javascript:|<script|<iframe/.test(result))
  assert.ok(!result.includes('background:'))
  assert.ok(result.includes('height:1em'))
})

test('unrelated/404 source pages are never silently imported as notes', () => {
  assert.throws(() => extractArticle(page('<p>Body</p>').replace('data-slug="content/essays/first-note"', 'data-slug="404"'), entry, [entry]), /does not match/)
  assert.throws(() => extractArticle('<html><body>No article</body></html>', entry, [entry]), /No published article/)
})

test('missing original media has an inline notice instead of a broken player', () => {
  const html = rewriteArticleAssets('<audio src="https://mathnuscript.com/missing.webm" controls></audio><p>Complete prose remains.</p>', new Map(), new Set(['https://mathnuscript.com/missing.webm']))
  assert.ok(!html.includes('<audio'))
  assert.ok(html.includes('unavailable in the published source'))
  assert.ok(html.includes('Complete prose remains.'))
})

test('every garden note has a full local body and generated files match the index', async () => {
  const manifest = JSON.parse(await readFile(new URL('../src/generated/garden-manifest.json', import.meta.url), 'utf8'))
  const articles = JSON.parse(await readFile(new URL('../src/generated/articles-manifest.json', import.meta.url), 'utf8'))
  assert.equal(articles.count, manifest.essays.length)
  const slugs = new Set(articles.articles.map(article => article.slug))
  for (const note of manifest.essays) assert.ok(slugs.has(note.slug), `No local body for ${note.slug}`)
  const files = (await readdir(new URL('../public/articles/', import.meta.url))).filter(file => file.endsWith('.json'))
  assert.equal(files.length, articles.count)
  const selected = articles.articles.find(article => /Choosing your Game/i.test(article.slug))
  const body = JSON.parse(await readFile(new URL(`../public/${selected.path}`, import.meta.url), 'utf8'))
  assert.ok(body.words > 500)
  assert.ok(body.html.includes('The road is paved organically'))
  assert.ok(body.html.includes('You are becoming a wholesome human being.'))
})
