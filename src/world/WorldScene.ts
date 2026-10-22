import * as THREE from 'three'
import { buildLandscape, type Landscape, type WorldTarget } from './landscape'
import { makeMessenger, type CharacterParts } from '../game/characters'
import { districts, districtById, type DistrictId } from './map'
import { FIXED_STEP, heightAt, snowAt, stepCharacter, findPath, type CharacterState, type Point } from './engine/terrain'
import type { GardenEnvironment, GardenLight, GardenWeather } from './environment'
import { boardingPoint, exitPoint, stepVehicle, vehicleAction as actOnVehicle, vehicleStatus, type VehicleId, type VehicleStatus } from './engine/vehicles'
import type { VehicleVisual } from './native/vehicles'

type Options = {
  onReady(): void
  onError(): void
  onLocation(id: DistrictId): void
  onNear(target: WorldTarget | null): void
  onOpen(target: WorldTarget): void
  onWalking(): void
  onRoute(route: { title: string; moving: boolean } | null): void
  onVehicle(status: VehicleStatus | null): void
}

/** A continuous native world. React receives semantic events, never frame poses. */
export class WorldScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-18, 18, 12, -12, .1, 900)
  private landscape: Landscape
  private player: THREE.Group
  private parts: CharacterParts
  private details: { torso: THREE.Group; head: THREE.Group; bag: THREE.Group; scarf: THREE.Group }
  private state: CharacterState = { x: 2, z: 12, y: heightAt(2, 12), vx: 0, vz: 0, vy: 0, grounded: true }
  private previous = { ...this.state }
  private focus = new THREE.Vector3(-3, 1.7, 8)
  private desiredFocus = this.focus.clone()
  private offset = new THREE.Vector3(20, 25, 29)
  private keys = new Set<string>()
  private touch = new THREE.Vector2()
  private input = { x: 0, z: 0 }
  private path: Point[] = []
  private routeTitle: string | null = null
  private routeCursor = 0
  private routeGoal: Point | null = null
  private routeStallTime = 0
  private active: DistrictId = 'trailhead'
  private near: WorldTarget | null = null
  private vehicle: VehicleVisual | null = null
  private lastVehicleStatus = ''
  private lastVehicleSpan = 0
  private paused = false
  private manualPaused = false
  private explored = false
  private overview = false
  private zoom = 1
  private yaw = .604
  private cursor = new THREE.Vector2()
  private clock = new THREE.Timer()
  private accumulator = 0
  private frame = 0
  private frames = 0
  private simulationTime = 0
  private visible = true
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  private handheld = window.matchMedia('(pointer: coarse)').matches
  private panelOpen = false
  private night = 0
  private nightTarget = 0
  private environment: GardenEnvironment = { weather: 'clear', light: 'day' }
  private golden = 0
  private shadowPosition = new THREE.Vector3(1000, 1000, 1000)
  private softwareGraphics = false
  private hemisphere: THREE.HemisphereLight
  private sun: THREE.DirectionalLight
  private lantern = new THREE.PointLight(0xffbc6b, 0, 9, 2)
  private resizeObserver: ResizeObserver
  private pointerStart: { x: number; y: number; id: number } | null = null
  private raycaster = new THREE.Raycaster()
  private postScene = new THREE.Scene()
  private postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private target: THREE.WebGLRenderTarget
  private ink: THREE.ShaderMaterial
  private frameTimes: number[] = []
  private fog = new THREE.Fog(0xc9d6bf, 65, 135)
  private aerialFog = new THREE.Fog(0xbdd5db, 180, 450)
  private aerialSky = new THREE.Color(0xbdd5db)
  private renderStats = { calls: 0, triangles: 0 }
  private jumpRequested = false
  private lastDraw = 0
  private lastInteractionTime = 0
  private daySun = new THREE.Color(0xfff4e0)
  private nightSun = new THREE.Color(0x9db8d0)
  private dayAmbient = new THREE.Color(0xf4f1e1)
  private nightAmbient = new THREE.Color(0x8aabc1)
  private dayFog = new THREE.Color(0xc9d6bf)
  private nightFog = new THREE.Color(0x283e48)
  private winterSun = new THREE.Color(0xfff8ed)
  private winterAmbient = new THREE.Color(0x91a7c7)
  private dayGround = new THREE.Color(0x697e6d)
  private winterGround = new THREE.Color(0x7c95a9)
  private winterFog = new THREE.Color(0xd0dfe3)

  constructor(private mount: HTMLDivElement, private options: Options) {
    const mobile = this.handheld || mount.clientWidth < 700
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
    const gl = this.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    this.softwareGraphics = Boolean(debug && /swiftshader|llvmpipe|software/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)))
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.softwareGraphics ? .9 : mobile ? 1.25 : 1.5))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.autoUpdate = false
    this.renderer.shadowMap.needsUpdate = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.domElement.setAttribute('aria-hidden', 'true')
    this.mount.appendChild(this.renderer.domElement)
    this.clock.connect(document)
    this.scene.background = new THREE.Color(0xc9d6bf)
    this.scene.fog = this.fog
    this.hemisphere = new THREE.HemisphereLight(0xf4f1e1, 0x697e6d, 1.45)
    this.sun = new THREE.DirectionalLight(0xfff4e0, 1.8)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(this.softwareGraphics ? 768 : mobile ? 1024 : 1536, this.softwareGraphics ? 768 : mobile ? 1024 : 1536)
    Object.assign(this.sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 100 })
    this.sun.shadow.bias = -.0002; this.sun.shadow.normalBias = .03
    this.scene.add(this.hemisphere, this.sun, this.sun.target, this.lantern)
    this.landscape = buildLandscape(this.scene)
    this.player = makeMessenger(this.landscape.gradient)
    this.player.scale.setScalar(1.05)
    this.parts = this.player.userData.parts
    this.details = this.player.userData.details
    this.player.position.set(this.state.x, this.state.y, this.state.z)
    this.scene.add(this.player)
    const marker = new THREE.Mesh(new THREE.RingGeometry(.44, .49, 24), new THREE.MeshBasicMaterial({ color: 0xf4e6b8, transparent: true, opacity: .65, side: THREE.DoubleSide, depthTest: false }))
    marker.rotation.x = -Math.PI / 2; marker.position.y = .025; marker.renderOrder = 10; this.player.add(marker)

    // Native geometry and depth supply the ink; there are no photographic scene planes.
    this.target = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter })
    this.target.texture.colorSpace = THREE.SRGBColorSpace
    this.target.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType)
    this.ink = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: { image: { value: this.target.texture }, depth: { value: this.target.depthTexture }, pixel: { value: new THREE.Vector2() } },
      vertexShader: 'varying vec2 vUv; void main() { vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
      fragmentShader: `uniform sampler2D image; uniform sampler2D depth; uniform vec2 pixel; varying vec2 vUv;
        void main() {
          vec3 c=texture2D(image,vUv).rgb;
          float d=texture2D(depth,vUv).r;
          float edge=abs(d-texture2D(depth,vUv+vec2(pixel.x,0.)).r)+abs(d-texture2D(depth,vUv+vec2(0.,pixel.y)).r);
          float line=smoothstep(.0012,.0045,edge);
          c=mix(c,vec3(.027,.054,.043),line*.58);
          gl_FragColor=vec4(c,1.);
          #include <colorspace_fragment>
        }`,
    })
    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.ink))
    this.camera.position.copy(this.focus).add(this.offset); this.camera.lookAt(this.focus)
    window.addEventListener('keydown', this.keyDown); window.addEventListener('keyup', this.keyUp); window.addEventListener('blur', this.clearInput)
    document.addEventListener('visibilitychange', this.visibilityChange)
    this.renderer.domElement.addEventListener('pointerdown', this.pointerDown)
    this.renderer.domElement.addEventListener('pointerup', this.pointerUp)
    this.renderer.domElement.addEventListener('pointermove', this.pointerMove)
    this.renderer.domElement.addEventListener('pointercancel', this.pointerCancel)
    this.renderer.domElement.addEventListener('webglcontextlost', this.contextLost)
    this.resizeObserver = new ResizeObserver(this.resize); this.resizeObserver.observe(mount)
    this.resize(); this.animate(); this.options.onReady()
  }

  spawnAt(id: DistrictId) {
    if (this.vehicle) { this.vehicle.state.speed = 0; this.vehicle = null; this.options.onVehicle(null) }
    const [x, z] = districtById(id).entrance
    Object.assign(this.state, { x, z, y: heightAt(x, z), vx: 0, vz: 0, vy: 0, grounded: true })
    Object.assign(this.previous, this.state)
    this.focus.set(x, this.state.y + 1.0, z)
    this.explored = true; this.active = id; this.options.onLocation(id)
  }
  begin() { this.explored = true; this.overview = false; this.resize() }
  setPanelOpen(open: boolean) { this.paused = open || this.overview || this.manualPaused; this.panelOpen = open; this.clearInput(); this.lastDraw = 0; this.resize() }
  setPaused(value: boolean) { this.manualPaused = value; this.paused = value || this.panelOpen || this.overview; if (this.paused) this.clearInput(); this.lastDraw = 0 }
  setTouch(x: number, y: number) {
    const released = this.touch.lengthSq() > .0001 && Math.hypot(x, y) < .001
    this.touch.set(x, y)
    if (released) { this.state.vx = 0; this.state.vz = 0 }
    if (Math.hypot(x, y) > .1) this.cancelRoute()
  }
  setZoom(direction: number) { this.zoom = THREE.MathUtils.clamp(this.zoom + direction * .13, .65, 1.6); this.resize() }
  setNight(value: boolean) { this.setEnvironment(value ? 'night' : 'day', this.environment.weather) }
  setEnvironment(light: GardenLight, weather: GardenWeather) { this.environment = { light, weather }; this.nightTarget = Number(light === 'night'); this.lastDraw = 0 }
  setOverview(value: boolean) { this.overview = value; this.paused = value || this.panelOpen || this.manualPaused; this.clearInput(); this.lastDraw = 0; this.renderer.shadowMap.needsUpdate = true; this.resize() }
  jump() { if (this.vehicle) this.vehicleAction(); else this.jumpRequested = true }
  walkTo(point: Point) { return this.navigate(point, 'the spot you chose') }
  cancelRoute() { this.path = []; this.routeCursor = 0; this.routeTitle = null; this.routeGoal = null; this.routeStallTime = 0; this.options.onRoute(null) }
  interact() {
    if (this.paused) return
    if (this.vehicle) { this.exitVehicle(); return }
    if (this.near?.kind === 'vehicle' && this.near.vehicleId) this.boardVehicle(this.near.vehicleId)
    else if (this.near) this.options.onOpen(this.near)
  }
  boardVehicle(id: VehicleId) {
    if (this.vehicle || this.paused) return false
    const vehicle = this.landscape.vehicles.find(item => item.definition.id === id)!
    const point = boardingPoint(vehicle.state)
    if (Math.hypot(this.state.x - point.x, this.state.z - point.z) > 4.2) return false
    this.cancelRoute(); this.clearInput(); this.vehicle = vehicle; this.explored = true
    Object.assign(this.state, { x: vehicle.state.x, z: vehicle.state.z, y: vehicle.state.y, vx: 0, vz: 0, vy: 0, grounded: true })
    Object.assign(this.previous, this.state); this.options.onWalking(); this.publishVehicle(); this.resize()
    return true
  }
  exitVehicle() {
    if (!this.vehicle) return true
    const point = exitPoint(this.vehicle.state, this.landscape.colliders)
    if (!point) return false
    this.vehicle.state.speed = 0; this.vehicle = null; this.lastVehicleStatus = ''; this.clearInput()
    Object.assign(this.state, { ...point, y: heightAt(point.x, point.z), grounded: true, vy: 0 })
    Object.assign(this.previous, this.state); this.options.onVehicle(null); this.resize()
    return true
  }
  vehicleAction() { if (this.vehicle && !this.paused) { actOnVehicle(this.vehicle.state); this.publishVehicle() } }
  navigateToVehicle(id: VehicleId) {
    const vehicle = this.landscape.vehicles.find(item => item.definition.id === id)!
    return this.navigate(boardingPoint(vehicle.state), vehicle.definition.name)
  }
  navigateToPerson(id: string) {
    const target = this.landscape.targets.find(item => item.personId === id)
    return target ? this.navigate({ x: target.x + 1, z: target.z + 1 }, target.title) : false
  }
  private publishVehicle() {
    if (!this.vehicle) return
    const status = vehicleStatus(this.vehicle.state, this.landscape.colliders), identity = JSON.stringify(status)
    if (identity !== this.lastVehicleStatus) { this.lastVehicleStatus = identity; this.options.onVehicle(status) }
  }
  navigateToDistrict(id: DistrictId) {
    const district = districtById(id)
    return this.navigate({ x: district.entrance[0], z: district.entrance[1] }, district.name)
  }
  navigateToEssay(slug: string) {
    const target = this.landscape.targets.find((item) => item.slug === slug)
    return target ? this.navigate(target, target.title) : false
  }
  private navigate(point: Point, title: string) {
    if (this.vehicle && !this.exitVehicle()) { this.options.onRoute({ title: 'Land or return to shore before choosing a walking route.', moving: false }); return false }
    this.path = findPath(this.state, point, this.landscape.colliders)
    this.routeCursor = 0
    if (!this.path.length) { this.options.onRoute({ title: 'This point is off the path. Try a nearby spot.', moving: false }); return false }
    this.routeGoal = this.path[this.path.length - 1]; this.routeStallTime = 0
    this.routeTitle = title; this.explored = true; this.overview = false; this.paused = this.panelOpen || this.manualPaused; this.resize()
    this.options.onWalking(); this.options.onRoute({ title, moving: true })
    return true
  }

  getSnapshot() {
    const average = this.frameTimes.length ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length : 0
    return { position: { x: this.state.x, y: this.state.y, z: this.state.z }, camera: this.camera.position.toArray(), district: this.active, near: this.near?.id ?? null, routeRemaining: this.path.length - this.routeCursor, paused: this.paused, manualPaused: this.manualPaused, grounded: this.state.grounded, drawCalls: this.renderStats.calls, triangles: this.renderStats.triangles, averageFrameMs: average, simulationTime: this.simulationTime, native: true, vehicle: this.vehicle ? vehicleStatus(this.vehicle.state, this.landscape.colliders) : null, fleet: this.landscape.vehicles.map(item => ({ ...item.state })), environment: { ...this.environment }, lighting: { night: this.night, golden: this.golden }, life: { ...this.landscape.statistics }, softwareGraphics: this.softwareGraphics }
  }

  private animate = () => {
    this.frame = requestAnimationFrame(this.animate)
    if (!this.visible) return
    const now = performance.now()
    if ((this.paused || this.overview) && now - this.lastDraw < 600) return
    this.lastDraw = now
    this.clock.update()
    const rawDelta = this.clock.getDelta(), dt = Math.min(rawDelta, .1)
    const elapsed = this.clock.getElapsed()
    this.frames++
    if (!this.paused) { this.frameTimes.push(rawDelta * 1000); if (this.frameTimes.length > 120) this.frameTimes.shift() }
    if (!this.paused) {
      this.accumulator = Math.min(this.accumulator + dt, .12)
      while (this.accumulator >= FIXED_STEP) { Object.assign(this.previous, this.state); this.simulate(FIXED_STEP); this.accumulator -= FIXED_STEP }
    }
    const alpha = this.paused ? 1 : this.accumulator / FIXED_STEP
    this.player.position.set(THREE.MathUtils.lerp(this.previous.x, this.state.x, alpha), THREE.MathUtils.lerp(this.previous.y, this.state.y, alpha), THREE.MathUtils.lerp(this.previous.z, this.state.z, alpha))
    this.player.visible = !this.vehicle || this.vehicle.definition.id === 'bike' || this.vehicle.definition.id === 'boat'
    if (this.vehicle) { this.player.position.y += .25; this.player.rotation.y = this.vehicle.state.heading }
    const speed = Math.hypot(this.state.vx, this.state.vz)
    if (speed > .1 && !this.vehicle) {
      const desired = Math.atan2(this.state.vx, this.state.vz)
      const delta = Math.atan2(Math.sin(desired - this.player.rotation.y), Math.cos(desired - this.player.rotation.y))
      this.player.rotation.y += delta * Math.min(1, dt * 12)
    }
    const riding = this.vehicle?.definition.id === 'bike'
    const swing = this.vehicle ? 0 : Math.sin(this.simulationTime * 10) * Math.min(speed / 4, 1) * .6
    this.parts.legL.rotation.x = riding ? -.75 : swing; this.parts.legR.rotation.x = riding ? -.75 : -swing
    this.parts.legL.rotation.z = riding ? -.25 : 0; this.parts.legR.rotation.z = riding ? .25 : 0
    this.parts.armL.rotation.x = riding ? -.9 : -swing * .7; this.parts.armR.rotation.x = riding ? -.9 : swing * .7
    const walkStrength = this.vehicle ? 0 : Math.min(speed / 4, 1)
    this.details.torso.position.y = Math.abs(Math.sin(this.simulationTime * 10)) * .018 * walkStrength
    this.details.bag.rotation.z = Math.sin(this.simulationTime * 10 + .6) * .065 * walkStrength
    this.details.head.rotation.z = Math.sin(this.simulationTime * 5) * .016 * walkStrength
    this.details.scarf.rotation.x = Math.sin(this.simulationTime * 8) * .08 * walkStrength
    const lightBlend = this.reducedMotion ? 1 : 1 - Math.exp(-Math.min(rawDelta, 1) * 1.3)
    this.night = THREE.MathUtils.lerp(this.night, this.nightTarget, lightBlend)
    this.golden = THREE.MathUtils.lerp(this.golden, Number(this.environment.light === 'golden'), lightBlend)
    this.landscape.update(elapsed, this.night, this.player.position, !this.reducedMotion, dt, this.environment)
    for (const vehicle of this.landscape.vehicles) vehicle.update(this.reducedMotion ? this.simulationTime : elapsed, this.paused ? 0 : dt, vehicle === this.vehicle)
    this.updateCamera(dt)
    this.updateLight()
    if (this.player.position.distanceTo(this.shadowPosition) > .35) { this.renderer.shadowMap.needsUpdate = true; this.shadowPosition.copy(this.player.position) }
    if (elapsed - this.lastInteractionTime > .1) { this.lastInteractionTime = elapsed; this.updateInteraction(); this.publishVehicle() }
    this.renderer.setRenderTarget(this.target); this.renderer.render(this.scene, this.camera)
    this.renderStats.calls = this.renderer.info.render.calls; this.renderStats.triangles = this.renderer.info.render.triangles
    this.renderer.setRenderTarget(null); this.renderer.render(this.postScene, this.postCamera)
  }

  private simulate(dt: number) {
    this.simulationTime += dt
    const horizontal = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')) + this.touch.x
    const vertical = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) + this.touch.y
    if (this.vehicle) {
      stepVehicle(this.vehicle.state, { x: horizontal, z: vertical }, dt, this.landscape.colliders, this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'))
      const vehicle = this.vehicle.state
      Object.assign(this.state, { x: vehicle.x, z: vehicle.z, y: vehicle.y, vx: Math.sin(vehicle.heading) * vehicle.speed, vz: Math.cos(vehicle.heading) * vehicle.speed, grounded: vehicle.phase === 'parked' || vehicle.phase === 'driving' })
      this.jumpRequested = false
      return
    }
    const manual = Math.hypot(horizontal, vertical) > .02
    this.input.x = Math.cos(this.yaw) * horizontal - Math.sin(this.yaw) * vertical
    this.input.z = -Math.sin(this.yaw) * horizontal - Math.cos(this.yaw) * vertical
    if (manual && this.routeTitle) this.cancelRoute()
    if (!manual && this.routeCursor < this.path.length) {
      const waypoint = this.path[this.routeCursor], dx = waypoint.x - this.state.x, dz = waypoint.z - this.state.z
      const distance = Math.hypot(dx, dz)
      if (distance < .28) {
        this.routeCursor++
        if (this.routeCursor >= this.path.length) {
          const title = this.routeTitle ?? 'the destination'; this.path = []; this.routeCursor = 0; this.routeTitle = null; this.routeGoal = null; this.options.onRoute({ title, moving: false })
        }
      } else { this.input.x = dx / distance; this.input.z = dz / distance }
    }
    if (Math.hypot(this.input.x, this.input.z) > .05 && !this.explored) { this.explored = true; this.resize(); this.options.onWalking() }
    const beforeX = this.state.x, beforeZ = this.state.z, followingPath = this.path.length > 0
    stepCharacter(this.state, this.input, dt, this.landscape.colliders, this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || followingPath, this.keys.has('Space') || this.jumpRequested, followingPath)
    if (followingPath && this.routeGoal) {
      this.routeStallTime = Math.hypot(this.state.x - beforeX, this.state.z - beforeZ) < .003 ? this.routeStallTime + dt : 0
      if (this.routeStallTime > .65) {
        const path = findPath(this.state, this.routeGoal, this.landscape.colliders)
        if (path.length) { this.path = path; this.routeCursor = 0 }
        else { this.cancelRoute(); this.options.onRoute({ title: 'Choose a nearby spot to continue walking.', moving: false }) }
        this.routeStallTime = 0
      }
    }
    this.jumpRequested = false
  }

  private updateCamera(dt: number) {
    const mobile = this.handheld || this.mount.clientWidth < 700
    if (this.overview) {
      this.desiredFocus.set(0, 1, -12)
      this.offset.set(170, 240, 260)
      this.scene.fog = null
    } else {
      if (this.explored) { this.desiredFocus.copy(this.player.position); this.desiredFocus.y += 1 }
      else this.desiredFocus.set(mobile ? 1.2 : -3, 1.7, mobile ? 15 : 8)
      const peek = this.reducedMotion || mobile ? 0 : this.cursor.x * .15
      this.yaw = THREE.MathUtils.lerp(this.yaw, .604 + peek, Math.min(1, dt * 3))
      this.offset.set(Math.sin(this.yaw) * 35, 25, Math.cos(this.yaw) * 35)
      this.scene.fog = this.fog
      if (this.vehicle?.definition.id === 'rocket') {
        const floor = heightAt(this.state.x, this.state.z), blend = THREE.MathUtils.smoothstep(this.state.y - floor, 8, 35)
        this.desiredFocus.y = THREE.MathUtils.lerp(this.player.position.y + 1, (this.state.y + floor) / 2 + 2, blend)
        this.offset.set(THREE.MathUtils.lerp(this.offset.x, 60, blend), THREE.MathUtils.lerp(25, 85, blend), THREE.MathUtils.lerp(this.offset.z, 90, blend))
      }
      if (this.vehicle && this.state.y - heightAt(this.state.x, this.state.z) > 15) this.scene.fog = this.aerialFog
      if (this.vehicle && Math.abs(this.vehicleSpan() - this.lastVehicleSpan) > .25) this.resize()
    }
    this.focus.lerp(this.desiredFocus, this.reducedMotion ? 1 : 1 - Math.exp(-dt * 5))
    this.camera.position.copy(this.focus).add(this.offset); this.camera.lookAt(this.focus)
  }

  private updateLight() {
    const n = this.night
    const snow = snowAt(this.state.x, this.state.z)
    this.sun.position.copy(this.player.position); this.sun.position.x -= 23; this.sun.position.y += 32; this.sun.position.z -= 21; this.sun.target.position.copy(this.player.position)
    this.sun.intensity = 1.8 + snow * .9 - n * (1.2 + snow * .9)
    this.sun.color.copy(this.daySun).lerp(this.winterSun, snow).lerp(this.nightSun, n)
    if (this.golden > .001) this.sun.color.lerp(new THREE.Color(0xffc088), this.golden * (1 - snow * .75))
    this.hemisphere.intensity = 1.45 - snow * .2 - n * .8
    this.hemisphere.color.copy(this.dayAmbient).lerp(this.winterAmbient, snow).lerp(this.nightAmbient, n)
    this.hemisphere.groundColor.copy(this.dayGround).lerp(this.winterGround, snow)
    this.fog.color.copy(this.dayFog).lerp(this.winterFog, snow).lerp(this.nightFog, n)
    this.fog.color.lerp(new THREE.Color(0xdfc6a4), this.golden * (1 - snow) * .4)
    if (this.environment.weather === 'rain') { this.fog.color.lerp(new THREE.Color(0x9aafa7), .22); this.sun.intensity *= .65 }
    ;(this.scene.background as THREE.Color).copy(this.fog.color)
    const altitude = Math.max(0, this.state.y - heightAt(this.state.x, this.state.z))
    if (altitude > 15) (this.scene.background as THREE.Color).lerp(this.aerialSky, Math.min(1, (altitude - 15) / 50) * (1 - n * .85))
    this.aerialFog.color.copy(this.scene.background as THREE.Color)
    this.lantern.position.copy(this.player.position); this.lantern.position.x += 1.15; this.lantern.position.y += 1.4; this.lantern.position.z += .5; this.lantern.intensity = n * 1.7
  }

  private updateInteraction() {
    let closest = Infinity, current: WorldTarget | null = null
    for (const target of this.vehicle ? [] : this.landscape.targets) {
      const distance = Math.hypot(this.state.x - target.x, this.state.z - target.z)
      const priority = distance - (target.kind === 'vehicle' || target.kind === 'person' ? 1.5 : 0)
      if (distance < target.radius && priority < closest) { closest = priority; current = target }
    }
    if (current?.id !== this.near?.id) { this.near = current; this.options.onNear(current) }
    let district: DistrictId = 'trailhead', distance = Infinity
    for (const item of districts) {
      const value = Math.hypot(this.state.x - item.entrance[0], this.state.z - item.entrance[1])
      if (value < distance) { distance = value; district = item.id }
    }
    if (district !== this.active) { this.active = district; this.options.onLocation(district) }
  }

  private keyDown = (event: KeyboardEvent) => {
    const target = event.target
    if (target instanceof HTMLElement && (target.isContentEditable || /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(target.tagName))) return
    if (this.paused) return
    if (event.code.startsWith('Arrow') || event.code === 'Space') event.preventDefault()
    this.keys.add(event.code)
    if (!event.repeat && (event.code === 'KeyE' || event.code === 'Enter')) this.interact()
    if (!event.repeat && event.code === 'Space' && this.vehicle) this.vehicleAction()
  }
  private keyUp = (event: KeyboardEvent) => { this.keys.delete(event.code) }
  private clearInput = () => { this.keys.clear(); this.touch.set(0, 0); this.cursor.set(0, 0); this.state.vx = 0; this.state.vz = 0 }
  private pointerDown = (event: PointerEvent) => { this.mount.focus({ preventScroll: true }); this.pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId } }
  private pointerCancel = () => { this.pointerStart = null }
  private pointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    const rect = this.mount.getBoundingClientRect()
    this.cursor.set((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1)
  }
  private pointerUp = (event: PointerEvent) => {
    if (this.paused || !this.pointerStart || event.pointerId !== this.pointerStart.id) return
    const dragged = Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y) > 12
    this.pointerStart = null
    if (dragged) return
    const rect = this.mount.getBoundingClientRect()
    this.raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2), this.camera)
    const hits = this.raycaster.intersectObject(this.landscape.terrain, false)
    if (hits.length) this.navigate({ x: hits[0].point.x, z: hits[0].point.z }, 'the spot you chose')
  }
  private visibilityChange = () => {
    this.visible = document.visibilityState === 'visible'; this.clearInput(); this.accumulator = 0; this.clock.reset()
  }
  private contextLost = (event: Event) => { event.preventDefault(); this.options.onError() }
  private vehicleSpan() {
    if (!this.vehicle) return 0
    const altitude = Math.max(0, this.state.y - heightAt(this.state.x, this.state.z))
    return this.vehicle.definition.id === 'rocket' ? 28 + altitude * 1.7 : this.vehicle.definition.id === 'plane' ? 30 + altitude * .75 : this.vehicle.definition.id === 'boat' ? 30 : 26
  }
  private resize = () => {
    const width = this.mount.clientWidth, height = this.mount.clientHeight
    if (!width || !height) return
    const mobile = this.handheld || width < 700
    const aspect = width / height
    this.lastVehicleSpan = this.vehicleSpan()
    const span = this.overview ? Math.max(280, 370 / aspect) : (this.lastVehicleSpan || (mobile ? this.explored ? 19 : 24 : 20)) / this.zoom
    this.camera.left = -span * aspect / 2; this.camera.right = span * aspect / 2; this.camera.top = span / 2; this.camera.bottom = -span / 2
    const offsetX = this.panelOpen && width > 900 ? Math.min(width * .15, 220) : this.overview && this.handheld && aspect > 1.2 ? Math.round(width * .17) : 0
    const offsetY = this.overview && aspect < .85 ? Math.round(height * .2) : 0
    this.camera.setViewOffset(width, height, offsetX, offsetY, width, height)
    this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height)
    const density = Math.min(window.devicePixelRatio, this.softwareGraphics ? .9 : mobile ? 1.25 : 1.5)
    const renderWidth = Math.round(width * density), renderHeight = Math.round(height * density)
    this.target.setSize(renderWidth, renderHeight); this.ink.uniforms.pixel.value.set(1 / renderWidth, 1 / renderHeight)
  }

  dispose() {
    cancelAnimationFrame(this.frame); this.resizeObserver.disconnect()
    this.clock.dispose()
    window.removeEventListener('keydown', this.keyDown); window.removeEventListener('keyup', this.keyUp); window.removeEventListener('blur', this.clearInput)
    document.removeEventListener('visibilitychange', this.visibilityChange)
    this.renderer.domElement.removeEventListener('pointerdown', this.pointerDown); this.renderer.domElement.removeEventListener('pointerup', this.pointerUp); this.renderer.domElement.removeEventListener('pointermove', this.pointerMove); this.renderer.domElement.removeEventListener('pointercancel', this.pointerCancel); this.renderer.domElement.removeEventListener('webglcontextlost', this.contextLost)
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>()
    const disposeScene = (scene: THREE.Scene) => scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite || object instanceof THREE.Points) {
        geometries.add(object.geometry)
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          materials.add(material)
          if ('map' in material && material.map instanceof THREE.Texture) textures.add(material.map)
        }
      }
    })
    disposeScene(this.scene); disposeScene(this.postScene)
    geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose()); textures.forEach((texture) => texture.dispose())
    this.landscape.dispose(); this.landscape.gradient.dispose(); this.target.dispose(); this.sun.shadow.dispose(); this.renderer.dispose(); this.renderer.domElement.remove()
  }
}
