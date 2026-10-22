import { chromium } from 'playwright-core'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const output = new URL('../.impeccable/review/expansion/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), headless: true, chromiumSandbox: true, args: ['--enable-unsafe-swiftshader'] })
const results = { checks: [], errors: [], observations: {} }
const check = (name, pass) => { const value = { name, pass: Boolean(pass) }; results.checks.push(value); console.log(JSON.stringify(value)) }
const snapshot = page => page.evaluate(() => window.__gardenEngine.getSnapshot())
async function replay(page, seconds, finishRoute = false) {
  await page.evaluate(({ seconds, finishRoute }) => {
    const world = window.__gardenEngine; world.setPaused(false)
    for (let i = 0; i < seconds * 60; i++) {
      Object.assign(world.previous, world.state); world.simulate(1 / 60)
      if (finishRoute && world.getSnapshot().routeRemaining === 0) break
    }
    Object.assign(world.previous, world.state); world.updateInteraction(); world.publishVehicle()
  }, { seconds, finishRoute })
  await page.waitForTimeout(200)
}
async function capture(page, name) {
  await page.evaluate(() => window.__gardenEngine.setPaused(true)); await page.waitForTimeout(900)
  await page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, output)) })
  await page.evaluate(() => window.__gardenEngine.setPaused(false))
}
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await context.newPage(); page.setDefaultTimeout(120000)
  page.on('pageerror', error => results.errors.push(error.message))
  await page.goto(`${process.env.MWAWERU_URL || 'http://127.0.0.1:5195'}/#essay/Choosing%20your%20Game%20will%20Choose%20Your%20Life`, { waitUntil: 'domcontentloaded' })
  await page.locator('.reader-content').waitFor()
  check('a cold shared article loads its full text without constructing WebGL', await page.evaluate(() => !window.__gardenEngine) && (await page.locator('.reader-content').textContent()).includes('The road is paved organically'))
  await page.getByRole('button', { name: 'Find this note in the garden', exact: true }).click()
  await page.waitForFunction(() => window.__gardenEngine?.getSnapshot().routeRemaining > 0, undefined, { timeout: 120000 })
  check('the walking destination survives deferred startup and starts once ready', (await snapshot(page)).routeRemaining > 0 && !(await snapshot(page)).paused)
  await replay(page, 90, true)
  results.observations.arrivedNote = await snapshot(page)
  check('the requested note is reached through the actual landscape', (await snapshot(page)).routeRemaining === 0 && (await page.locator('.walk-status').textContent()).includes('Reached'))
  await capture(page, 'cold-reader-navigation')
  await page.evaluate(() => window.__gardenEngine.navigateToVehicle('rocket')); await replay(page, 120, true)
  await page.locator('.interaction-prompt').click()
  await capture(page, 'desktop-rocket-boarded')
  await page.getByRole('button', { name: 'Launch', exact: true }).click(); await replay(page, 11)
  check('the rocket still reaches its hover state', (await snapshot(page)).vehicle.phase === 'hovering')
  await page.getByRole('button', { name: 'Land vertically', exact: true }).click(); await replay(page, 8)
  await capture(page, 'desktop-rocket-descent')
  await replay(page, 25)
  await capture(page, 'desktop-landed')
  const landed = await snapshot(page)
  const distance = Math.hypot(landed.camera[0] - landed.position.x, landed.camera[1] - landed.position.y, landed.camera[2] - landed.position.z)
  results.observations.landed = { vehicle: landed.vehicle, position: landed.position, cameraDistance: distance }
  check('the parked rocket returns to a ground camera inside the clear fog range', landed.vehicle.phase === 'parked' && landed.vehicle.canExit && distance < 60)
  await context.close()
} catch (error) { results.errors.push(error.stack || error.message); process.exitCode = 1 }
finally {
  await writeFile(new URL('review-fixes.json', output), JSON.stringify(results, null, 2)); await browser.close()
  console.log(JSON.stringify({ passed: results.checks.filter(item => item.pass).length, total: results.checks.length, errors: results.errors }, null, 2))
  if (results.errors.length || results.checks.some(item => !item.pass)) process.exitCode = 1
}
