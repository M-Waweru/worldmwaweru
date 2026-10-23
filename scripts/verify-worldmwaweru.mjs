import { chromium } from 'playwright-core'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.join(root, '.impeccable/review/worldmwaweru')
await mkdir(output, { recursive: true })
const base = process.env.MWAWERU_URL || 'http://127.0.0.1:5195'
const articles = JSON.parse(await readFile(path.join(root, 'src/generated/articles-manifest.json'), 'utf8'))
const garden = JSON.parse(await readFile(path.join(root, 'src/generated/garden-manifest.json'), 'utf8'))
const results = { checkedAt: new Date().toISOString(), checks: [], errors: [], articleRequests: [], snapshots: {} }
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), headless: true, chromiumSandbox: true, args: ['--enable-unsafe-swiftshader'] })
const check = (name, pass) => { results.checks.push({ name, pass: Boolean(pass) }); console.log(JSON.stringify(results.checks.at(-1))) }
async function snapshot(page) { return page.evaluate(() => window.__gardenEngine?.getSnapshot() ?? null) }
async function capture(page, name) {
  const current = await snapshot(page), previous = current?.manualPaused ?? false
  if (current) await page.evaluate(() => window.__gardenEngine.setPaused(true))
  await page.waitForTimeout(700)
  await page.screenshot({ path: path.join(output, `${name}.png`) }); results.snapshots[name] = await snapshot(page)
  if (current) await page.evaluate(value => window.__gardenEngine.setPaused(value), previous)
}
async function load(page, hash = '') {
  page.on('pageerror', error => results.errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') results.errors.push(message.text()) })
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) results.errors.push(`${response.status()} ${response.url()}`) })
  page.on('request', request => { if (request.url().includes('/articles/') && request.resourceType() === 'fetch') results.articleRequests.push(request.url()) })
  await page.goto(`${base}/${hash}`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__gardenEngine?.getSnapshot().native, undefined, { timeout: 90000 })
  await page.waitForSelector('.world-loading', { state: 'hidden', timeout: 15000 })
}
async function reader(page) { await page.waitForSelector('.reader-content', { timeout: 20000 }) }

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await context.newPage(); await load(page); await capture(page, 'desktop')
  check('the connected world still contains 155 published notes', (await snapshot(page)).life.notes === 155)
  await page.getByRole('button', { name: 'Writing', exact: true }).click()
  check('all 155 posts remain in the local index', await page.locator('.note-entry').count() === 155)
  await page.getByRole('searchbox', { name: 'Search notes' }).fill('Choosing your Game')
  await page.locator('.note-entry').first().click(); await reader(page)
  const prose = await page.locator('.reader-content').textContent()
  check('the full article is rendered here, including its final paragraph', prose.includes('The road is paved organically') && prose.includes('You are becoming a wholesome human being.') && prose.split(/\s+/).length > 500)
  check('reading does not redirect away from this website', new URL(page.url()).origin === new URL(base).origin)
  check('the external read-more requirement is removed', await page.getByRole('link', { name: 'Read the full note' }).count() === 0)
  await capture(page, 'desktop-reader')
  const position = (await snapshot(page)).position; await page.waitForTimeout(800)
  check('full-length reading preserves the visitor’s actual world position', JSON.stringify((await snapshot(page)).position) === JSON.stringify(position))
  await page.reload(); await reader(page)
  check('a shared article deep link opens its full text before WebGL startup', (await page.locator('.reader-content').textContent()).includes('The road is paved organically') && await snapshot(page) === null)

  let linked
  for (const record of articles.articles) {
    const article = JSON.parse(await readFile(path.join(root, 'public', record.path), 'utf8'))
    if (article.html.includes('data-essay-slug=')) { linked = record; break }
  }
  if (linked) {
    await page.goto(`${base}/#essay/${encodeURIComponent(linked.slug)}`); await reader(page)
    const link = page.locator('.reader-content a[data-essay-slug]').first()
    const nextSlug = await link.getAttribute('data-essay-slug')
    await link.click(); await reader(page)
    await page.waitForFunction(slug => decodeURIComponent(location.hash.slice(7)) === slug, nextSlug)
    check('wiki/note links open another post within this reader', new URL(page.url()).origin === new URL(base).origin && garden.essays.some(note => note.slug === nextSlug))
  } else check('wiki/note links open another post within this reader', false)
  await page.getByRole('button', { name: 'Links', exact: true }).click()
  check('owner-approved Thenks and verified social destinations are included', await page.locator('.elsewhere-list a[href="https://www.thenks.co/"]').count() === 1 && await page.locator('.elsewhere-list a[href="https://www.linkedin.com/in/mathenge-waweru"]').count() === 1 && await page.locator('.elsewhere-list a[href="https://x.com/mathenge_waweru"]').count() === 1)
  await capture(page, 'desktop-links')
  await page.locator('.elsewhere-list button').filter({ hasText: 'Mathnuscripts' }).click()
  check('the Mathnuscripts collection link opens the in-site index', await page.locator('.note-entry').count() === 155)
  await page.getByRole('button', { name: 'About', exact: true }).click()
  check('the supplied current biography and real contact links are available', (await page.locator('.about-content').textContent()).includes('Founder & CEO of Thenks') && await page.locator('.contact-links a[href="mailto:mathenge2waweru@gmail.com"]').count() === 1)
  await capture(page, 'desktop-about')
  await page.getByRole('button', { name: 'Work', exact: true }).click()
  check('Thenks and the linked historical projects appear in Work', (await page.locator('.work-content').textContent()).includes('Thenks') && (await page.locator('.work-content').textContent()).includes('Agrarian'))
  await capture(page, 'desktop-work')
  await context.close()

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  const mobile = await mobileContext.newPage(); await load(mobile); await capture(mobile, 'mobile')
  check('six mobile garden tools fit without document overflow', await mobile.locator('.garden-actions button').count() === 6 && await mobile.evaluate(() => document.documentElement.scrollWidth === 390))
  await mobile.getByRole('button', { name: 'Links', exact: true }).tap(); await capture(mobile, 'mobile-links')
  await mobile.locator('.elsewhere-list button').filter({ hasText: 'Mathnuscripts' }).tap()
  await mobile.getByRole('searchbox', { name: 'Search notes' }).fill('Choosing your Game'); await mobile.locator('.note-entry').first().tap(); await reader(mobile)
  check('the complete article can be read on mobile', (await mobile.locator('.reader-content').textContent()).includes('You are becoming a wholesome human being.'))
  await capture(mobile, 'mobile-reader')
  await mobile.locator('.portfolio-sheet').evaluate(element => { element.scrollTop = element.scrollHeight })
  check('the complete mobile article scrolls within its paper reading sheet', await mobile.locator('.portfolio-sheet').evaluate(element => element.scrollTop > 500))
  check('article-body requests stay on the website’s own origin', results.articleRequests.length > 0 && results.articleRequests.every(url => new URL(url).origin === new URL(base).origin))
  await mobileContext.close()

  const fallbackContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await fallbackContext.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return String(type).startsWith('webgl') ? null : original.call(this, type, ...args) }
  })
  const fallback = await fallbackContext.newPage()
  const selected = articles.articles.find(article => /Choosing your Game/i.test(article.slug))
  await fallback.goto(`${base}/#essay/${encodeURIComponent(selected.slug)}`); await reader(fallback)
  check('full posts remain readable when WebGL is unavailable', (await fallback.locator('.reader-content').textContent()).includes('You are becoming a wholesome human being.') && await fallback.locator('.world-loading').count() === 0)
  const backgrounds = await fallback.evaluate(() => ['.portfolio-sheet', '.sheet-toolbar'].map(selector => getComputedStyle(document.querySelector(selector)).backgroundColor))
  check('the reader and toolbar keep opaque paper without WebGL', backgrounds.every(color => color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') && await fallback.locator('.world-unavailable').count() === 0)
  await fallback.screenshot({ path: path.join(output, 'reader-no-webgl.png') })
  await fallbackContext.close()
} catch (error) { results.errors.push(error.stack || error.message); process.exitCode = 1 }
finally {
  await browser.close(); await writeFile(path.join(output, 'verification.json'), JSON.stringify(results, null, 2))
  console.log(JSON.stringify({ passed: results.checks.filter(check => check.pass).length, total: results.checks.length, errors: results.errors }, null, 2))
  if (results.errors.length || results.checks.some(check => !check.pass)) process.exitCode = 1
}
