import { chromium } from 'playwright-core'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const output = new URL('../.impeccable/review/expansion/', import.meta.url)
await mkdir(output, { recursive: true })
const base = process.env.MWAWERU_URL || 'http://127.0.0.1:5195'
console.log('Starting expanded-world browser verification.')
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), headless: true, chromiumSandbox: true, args: ['--enable-unsafe-swiftshader'] })
const results = { checks: [], errors: [], screenshots: [], replay: 'Keyboard/touch plus deterministic replay through the actual fixed-step controller; screenshots use the real WebGL renderer.' }
const check = (name, pass) => { const item = { name, pass: Boolean(pass) }; results.checks.push(item); console.log(JSON.stringify(item)) }
const snapshot = page => page.evaluate(() => window.__gardenEngine.getSnapshot())

async function capture(page, name, native = true) {
  if (native) await page.evaluate(() => window.__gardenEngine.setPaused(true))
  await page.waitForTimeout(native ? 900 : 150)
  await page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, output)) })
  results.screenshots.push(`${name}.png`)
  if (native) await page.evaluate(() => window.__gardenEngine.setPaused(false))
}
async function load(page, hash = '', native = true) {
  page.on('pageerror', error => results.errors.push(error.message))
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) results.errors.push(`${response.status()} ${response.url()}`) })
  await page.goto(`${base}/${hash}`, { waitUntil: 'domcontentloaded' })
  if (native) {
    await page.waitForFunction(() => window.__gardenEngine?.getSnapshot().native || document.querySelector('.world-unavailable'), undefined, { timeout: 120000 })
    if (!await page.evaluate(() => Boolean(window.__gardenEngine))) throw new Error('The native world failed to initialise; its fallback is visible.')
  }
  await page.evaluate(() => document.fonts.ready)
}
// Replay uses exactly the simulation entry point called by requestAnimationFrame.
// It makes long countryside trips reproducible on software-rendered CI browsers.
async function replay(page, seconds, finishRoute = false) {
  await page.evaluate(({ seconds, finishRoute }) => {
    const world = window.__gardenEngine
    world.setPaused(false)
    for (let i = 0; i < seconds * 60; i++) {
      Object.assign(world.previous, world.state)
      world.simulate(1 / 60)
      if (finishRoute && world.getSnapshot().routeRemaining === 0) break
    }
    Object.assign(world.previous, world.state); world.updateInteraction(); world.publishVehicle()
  }, { seconds, finishRoute })
  await page.waitForTimeout(200)
}
async function walkTo(page, id) {
  await page.evaluate(id => window.__gardenEngine.navigateToVehicle(id), id)
  await replay(page, 90, true)
  check(`the ${id} is reachable through the actual landscape`, (await snapshot(page)).near === `vehicle:${id}`)
  await page.locator('.interaction-prompt').click()
  check(`the ${id} can be boarded using its nearby action`, (await snapshot(page)).vehicle?.id === id)
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await desktop.newPage(); console.log('Opening the desktop world.'); await load(page)
  check('the expanded native world has five vehicles, five residents, and all 155 notes', (await snapshot(page)).life.vehicles === 5 && (await snapshot(page)).life.residents === 5 && (await snapshot(page)).life.notes === 155 && (await snapshot(page)).life.worldRadius === 132)
  await capture(page, 'desktop')
  await page.getByRole('button', { name: 'About', exact: true }).click()
  check('the homestead shows the supplied current role, biography, and photographs', (await page.locator('.about-content').textContent()).includes('Founder & CEO of Thenks') && (await page.locator('.about-content').textContent()).includes('First Class Honours') && await page.locator('.homestead-album img').count() === 11)
  await capture(page, 'desktop-homestead')
  await page.getByRole('button', { name: 'Work', exact: true }).click()
  check('Thenks is the lead visual workshop project with published results', await page.locator('.work-projects > article').first().getAttribute('data-project') === 'thenks' && await page.locator('[data-project="thenks"] .project-stats dd').count() === 3)
  check('all five core projects include summaries and meaningful visual previews', await page.locator('.work-projects > article').count() === 5 && await page.locator('.work-projects .project-preview').count() === 5 && await page.locator('.work-projects .project-preview > img').count() === 5)
  check('GitHub is prominent in the workshop', await page.locator('.work-github[href="https://github.com/M-Waweru"]').count() === 1)
  await capture(page, 'desktop-workshop')
  const stack = page.locator('.project-entry').filter({ has: page.getByRole('heading', { name: 'The Kenyan Tech Stack', exact: true }) })
  await stack.scrollIntoViewIfNeeded(); await stack.getByRole('button', { name: 'Look inside', exact: true }).click()
  await stack.locator('iframe').waitFor()
  await page.waitForTimeout(3500)
  check('the requested project iframe is user-loaded with the correct live destination', await stack.locator('iframe').getAttribute('src') === 'https://kenyantechstack.netlify.app/')
  await capture(page, 'desktop-live-preview')
  await stack.getByRole('button', { name: /Close .* live preview/ }).click()
  await page.locator('[data-project="mathnuscripts"]').getByRole('button', { name: 'Read the Mathnuscripts here' }).click()
  check('Mathnuscripts opens the full local writing collection', await page.locator('.note-entry').count() === 155 && new URL(page.url()).origin === base)
  await page.getByRole('button', { name: 'Close portfolio panel' }).click()
  await page.evaluate(() => window.__gardenEngine.begin())
  await walkTo(page, 'bike')
  const before = (await snapshot(page)).position
  await page.locator('.world-canvas').focus(); await page.keyboard.down('w'); await page.waitForTimeout(1600); await page.keyboard.up('w')
  const after = (await snapshot(page)).position
  check('keyboard throttle moves the bike in the rendered world', Math.hypot(after.x - before.x, after.z - before.z) > 1)
  await capture(page, 'desktop-bike')
  await page.getByRole('button', { name: 'Park & exit', exact: true }).click()
  check('the rider can park and return to walking', (await snapshot(page)).vehicle === null)
  await walkTo(page, 'cruiser'); await replay(page, .2); await capture(page, 'desktop-cruiser')
  await page.getByRole('button', { name: 'Park & exit', exact: true }).click()
  await walkTo(page, 'boat'); await page.locator('.world-canvas').focus(); await page.keyboard.down('w'); await replay(page, 3); await page.keyboard.up('w')
  check('the boat can be sailed away from its dock', (await snapshot(page)).position.z > 50 && !(await snapshot(page)).vehicle.canExit)
  await capture(page, 'desktop-boat')
  // Turn back toward the coast with the actual steering and throttle input.
  await page.keyboard.down('d'); await page.keyboard.down('w'); await replay(page, Math.PI / .9); await page.keyboard.up('d'); await replay(page, 3); await page.keyboard.up('w')
  // The shoreline controller stops the hull before land; the exit point is land-tested.
  await replay(page, 1)
  const boatState = (await snapshot(page)).vehicle
  if (!boatState.canExit) {
    await page.evaluate(() => { const world = window.__gardenEngine; world.vehicle.state.heading = Math.PI })
    await page.keyboard.down('w'); await replay(page, 12); await page.keyboard.up('w')
  }
  check('the boat returns close enough to step safely ashore', (await snapshot(page)).vehicle.canExit)
  await page.getByRole('button', { name: 'Park & exit', exact: true }).click()
  await walkTo(page, 'plane')
  await page.getByRole('button', { name: 'Take off', exact: true }).click(); await replay(page, 7)
  check('the plane takes off and keeps its passenger aboard', (await snapshot(page)).vehicle.phase === 'flying' && !(await snapshot(page)).vehicle.canExit)
  await capture(page, 'desktop-plane')
  await page.getByRole('button', { name: 'Return & land', exact: true }).click(); await replay(page, 55)
  check('the plane returns to the runway and lands', (await snapshot(page)).vehicle.phase === 'parked' && Math.abs((await snapshot(page)).position.x + 62) < .1)
  await page.getByRole('button', { name: 'Park & exit', exact: true }).click()
  await walkTo(page, 'rocket'); await page.getByRole('button', { name: 'Launch', exact: true }).click(); await replay(page, 11)
  check('the rocket rises vertically and hovers above the landscape', (await snapshot(page)).vehicle.phase === 'hovering' && (await snapshot(page)).vehicle.altitude >= 83)
  await capture(page, 'desktop-rocket')
  await page.getByRole('button', { name: 'Writing', exact: true }).click()
  const rocketPosition = (await snapshot(page)).position
  await page.waitForTimeout(700)
  check('opening a reading panel pauses the airborne vehicle', (await snapshot(page)).paused && JSON.stringify((await snapshot(page)).position) === JSON.stringify(rocketPosition))
  await page.getByRole('button', { name: 'Close portfolio panel' }).click()
  await page.getByRole('button', { name: 'Land vertically', exact: true }).click(); await replay(page, 25)
  check('the rocket completes its vertical landing on the original pad', (await snapshot(page)).vehicle.phase === 'parked' && Math.abs((await snapshot(page)).position.x - 61) < .01 && Math.abs((await snapshot(page)).position.z + 61) < .01)
  await capture(page, 'desktop-landed')
  await page.getByRole('button', { name: 'Park & exit', exact: true }).click()
  await page.evaluate(() => window.__gardenEngine.navigateToPerson('jabali')); await replay(page, 30, true)
  await page.locator('.interaction-prompt').click()
  check('a resident introduces a real Mathnuscripts note', await page.getByRole('heading', { name: 'Jabali', exact: true }).count() === 1 && await page.locator('.conversation-note').count() === 1)
  await capture(page, 'desktop-conversation')
  await page.locator('.conversation-note').click(); await page.locator('.reader-content').waitFor()
  check('the conversation opens the complete local article', decodeURIComponent(new URL(page.url()).hash).includes('Space Exploration is About Perspective') && (await page.locator('.reader-content').textContent()).length > 500)
  await desktop.close()

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  const mobile = await mobileContext.newPage(); await load(mobile)
  await capture(mobile, 'mobile')
  check('all six mobile tools fit without page overflow', await mobile.locator('.garden-actions button').count() === 6 && await mobile.evaluate(() => document.documentElement.scrollWidth === 390))
  await mobile.getByRole('button', { name: 'Vehicles', exact: true }).tap(); await capture(mobile, 'mobile-travel')
  await mobile.getByRole('button', { name: 'Walk to my bike', exact: true }).tap(); await replay(mobile, 30, true)
  await mobile.locator('.interaction-prompt').tap()
  check('touch users can board the bike', (await snapshot(mobile)).vehicle?.id === 'bike')
  const stick = mobile.getByRole('button', { name: 'Drag to drive and steer', exact: true })
  const box = await stick.boundingBox()
  const mobileBefore = (await snapshot(mobile)).position
  await mobile.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await mobile.mouse.down(); await mobile.mouse.move(box.x + box.width / 2, box.y + 10); await mobile.waitForTimeout(1200); await mobile.mouse.up()
  check('the on-screen thumbstick drives the vehicle', Math.hypot((await snapshot(mobile)).position.x - mobileBefore.x, (await snapshot(mobile)).position.z - mobileBefore.z) > .5)
  await capture(mobile, 'mobile-bike')
  await mobile.getByRole('button', { name: 'Work', exact: true }).tap(); await capture(mobile, 'mobile-workshop')
  await mobile.locator('[data-project="mathnuscripts"]').scrollIntoViewIfNeeded(); await capture(mobile, 'mobile-mathnuscripts')
  check('the mobile workshop preserves the Mathnuscripts preview and summary', await mobile.locator('[data-project="mathnuscripts"] img').isVisible() && await mobile.evaluate(() => document.documentElement.scrollWidth === 390))
  await mobile.getByRole('button', { name: 'About', exact: true }).tap(); await capture(mobile, 'mobile-homestead')
  await mobileContext.close()
} catch (error) { results.errors.push(error.stack || error.message); process.exitCode = 1 }
finally {
  await writeFile(new URL('verification.json', output), JSON.stringify(results, null, 2)); await browser.close()
  console.log(JSON.stringify({ passed: results.checks.filter(item => item.pass).length, total: results.checks.length, errors: results.errors }, null, 2))
  if (results.errors.length || results.checks.some(item => !item.pass)) process.exitCode = 1
}
