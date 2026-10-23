import { chromium } from 'playwright-core'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const output = new URL('../.impeccable/review/controls/', import.meta.url)
await mkdir(output, { recursive: true })
const projects = JSON.parse(await readFile(new URL('../content/projects.json', import.meta.url), 'utf8')).projects
const base = process.env.MWAWERU_URL || 'http://127.0.0.1:5195'
const results = { checks: [], errors: [], controls: [] }
const check = (name, pass) => { const result = { name, pass: Boolean(pass) }; results.checks.push(result); console.log(JSON.stringify(result)) }
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), headless: true, chromiumSandbox: true, args: ['--enable-unsafe-swiftshader'] })
const capture = (page, name) => page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, output)) })

try {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' })
  const page = await context.newPage(); page.setDefaultTimeout(120000)
  page.on('pageerror', error => results.errors.push(error.message))
  await page.goto(`${base}/#garden`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__gardenEngine?.getSnapshot().native, undefined, { timeout: 120000 })
  for (const id of ['bike', 'cruiser', 'boat', 'plane']) {
    await page.evaluate(id => {
      const world = window.__gardenEngine; world.setPaused(false); world.begin(); world.navigateToVehicle(id)
      for (let i = 0; i < 120 * 60 && world.getSnapshot().routeRemaining > 0; i++) { Object.assign(world.previous, world.state); world.simulate(1 / 60) }
      Object.assign(world.previous, world.state); world.updateInteraction()
    }, id)
    await page.locator('.interaction-prompt').click()
    const original = await page.evaluate(() => ({ ...window.__gardenEngine.vehicle.state }))
    check(`${id}: board through the nearby action`, await page.evaluate(id => window.__gardenEngine.getSnapshot().vehicle?.id === id, id))
    const cases = [['ArrowLeft', -1, false], ['ArrowRight', 1, false], ['KeyA', -1, false], ['KeyD', 1, false], ['ArrowLeft', -1, true], ['ArrowRight', 1, true], ['touch', -1, false], ['touch', 1, false]]
    for (const [code, direction, reverse] of cases) {
      const observation = await page.evaluate(({ id, code, direction, reverse }) => {
        const world = window.__gardenEngine, state = world.vehicle.state
        world.setPaused(false); world.clearInput()
        const x = id === 'boat' ? 0 : -62, z = id === 'boat' ? 70 : -45
        Object.assign(state, { x, z, y: id === 'boat' ? .43 : id === 'plane' && !reverse ? 26 : 1.3, heading: 0, speed: reverse ? -3 : id === 'plane' ? 19 : 6, phase: id === 'plane' && !reverse ? 'flying' : id === 'plane' ? 'parked' : 'driving' })
        const throttle = code.startsWith('Key') ? 'KeyW' : reverse ? 'ArrowDown' : 'ArrowUp'
        if (code === 'touch') world.setTouch(direction, 1)
        else for (const key of [throttle, code]) window.dispatchEvent(new KeyboardEvent('keydown', { code: key }))
        for (let i = 0; i < 18; i++) { Object.assign(world.previous, world.state); world.simulate(1 / 60) }
        if (code === 'touch') world.setTouch(0, 0)
        else for (const key of [throttle, code]) window.dispatchEvent(new KeyboardEvent('keyup', { code: key }))
        world.setPaused(true)
        Object.assign(world.previous, world.state); world.player.position.set(world.state.x, world.state.y, world.state.z)
        world.vehicle.update(0, 0, true); world.updateCamera(1 / 60); world.publishVehicle()
        const camera = world.getSnapshot().camera
        const behind = (camera[0] - state.x) * Math.sin(state.heading) + (camera[2] - state.z) * Math.cos(state.heading)
        return { id, code, direction, reverse, lateral: -(state.x - x), heading: state.heading, cameraBehind: behind < -30 }
      }, { id, code, direction, reverse })
      results.controls.push(observation)
      check(`${id}: ${reverse ? 'reverse ' : ''}${code} ${direction < 0 ? 'left' : 'right'} and rear camera`, observation.lateral * direction > .01 && observation.cameraBehind)
    }
    if (id === 'bike') {
      await page.waitForTimeout(700)
      check('driving actions stay clear of the map on a smaller desktop', await page.evaluate(() => document.querySelector('.vehicle-hud').getBoundingClientRect().right < document.querySelector('.garden-map').getBoundingClientRect().left))
      await capture(page, 'desktop-driving')
    }
    await page.evaluate(original => {
      const world = window.__gardenEngine; Object.assign(world.vehicle.state, original); world.setPaused(false); world.exitVehicle()
    }, original)
  }
  // Confirm actual browser keyboard delivery as well as the controlled fixtures.
  await page.evaluate(() => { const world = window.__gardenEngine; world.navigateToVehicle('bike'); for (let i = 0; i < 7200 && world.getSnapshot().routeRemaining; i++) world.simulate(1 / 60); world.updateInteraction(); world.boardVehicle('bike') })
  await page.locator('.world-canvas').focus()
  await page.keyboard.down('ArrowLeft'); await page.keyboard.down('ArrowUp')
  check('browser arrow keys reach the same vehicle controller', await page.evaluate(() => window.__gardenEngine.getSnapshot().vehicle?.id === 'bike' && window.__gardenEngine.keys.has('ArrowLeft') && window.__gardenEngine.keys.has('ArrowUp')))
  await page.keyboard.up('ArrowLeft'); await page.keyboard.up('ArrowUp')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => {
    const world = window.__gardenEngine
    Object.assign(world.vehicle.state, { x: -62, z: -45, y: 1.3, heading: 0, speed: 6, phase: 'driving' })
    world.setPaused(false)
  })
  const stick = page.getByRole('button', { name: 'Drag to drive and steer', exact: true }), box = await stick.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2 - 20)
  const touchSteeredRight = await page.evaluate(() => {
    const world = window.__gardenEngine, received = world.touch.x > .4 && world.touch.y > .4
    for (let i = 0; i < 18; i++) { Object.assign(world.previous, world.state); world.simulate(1 / 60) }
    return received && world.vehicle.state.heading < 0 && world.vehicle.state.x < -62
  })
  await page.mouse.up(); await page.evaluate(() => window.__gardenEngine.setPaused(true)); await page.waitForTimeout(700)
  check('the actual mobile thumbstick steers toward its right-hand side', touchSteeredRight)
  await capture(page, 'mobile-driving')
  await context.close()

  for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }], ['small-mobile', { width: 320, height: 740 }]]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
    await context.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function(type, ...args) { return String(type).startsWith('webgl') ? null : getContext.call(this, type, ...args) }
    })
    const page = await context.newPage(); page.on('pageerror', error => results.errors.push(error.message))
    await page.goto(`${base}/#work`, { waitUntil: 'domcontentloaded' })
    const thenks = page.locator('[data-project="thenks"]')
    await thenks.locator('img').waitFor(); await page.evaluate(() => document.fonts.ready)
    check(`${name}: Thenks leads with the www URL and real preview`, await page.locator('.work-projects > article').first().getAttribute('data-project') === 'thenks' && await thenks.getByRole('link', { name: 'Explore Thenks' }).getAttribute('href') === 'https://www.thenks.co/')
    const values = await thenks.locator('.project-stats dd').allTextContents()
    check(`${name}: all three published results and their reporting context are visible`, JSON.stringify(values) === JSON.stringify(projects[0].stats.map(stat => stat.value)) && (await thenks.textContent()).includes('first eight months') && await thenks.locator('.project-stats-source a').getAttribute('href') === projects[0].statsSource)
    await capture(page, `${name}-workshop`)
    await thenks.locator('.project-stats').scrollIntoViewIfNeeded()
    check(`${name}: statistics fit their paper sheet`, await thenks.locator('.project-stats').evaluate(element => element.scrollWidth <= element.clientWidth + 1) && await page.evaluate(() => document.documentElement.scrollWidth === innerWidth))
    await capture(page, `${name}-thenks-stats`)
    await page.locator('[data-project="mathnuscripts"]').getByRole('button', { name: 'Read the Mathnuscripts here' }).click()
    check(`${name}: Mathnuscripts still opens all 155 local notes`, await page.locator('.note-entry').count() === 155)
    await context.close()
  }
} catch (error) { results.errors.push(error.stack || error.message); process.exitCode = 1 }
finally {
  await writeFile(new URL('verification.json', output), JSON.stringify(results, null, 2)); await browser.close()
  console.log(JSON.stringify({ passed: results.checks.filter(result => result.pass).length, total: results.checks.length, errors: results.errors }, null, 2))
  if (results.errors.length || results.checks.some(result => !result.pass)) process.exitCode = 1
}
