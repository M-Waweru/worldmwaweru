import * as THREE from 'three'
import { P } from './palette'
import { softCircleTexture } from './textures'
import { buildWorld, type World, type Collider } from './world'
import { makeMessenger, makeKijazo } from './characters'

export type NearTarget = { kind: 'essay'; index: number } | { kind: 'kijazo' } | null

type Callbacks = {
  onReady(): void
  onNear(target: NearTarget): void
  onInteract(target: Exclude<NearTarget, null>): void
}

function makeToonGradient() {
  const steps = [100, 170, 232, 255]
  const data = new Uint8Array(steps.length * 4)
  steps.forEach((value, index) => {
    data[index * 4] = value
    data[index * 4 + 1] = value
    data[index * 4 + 2] = value
    data[index * 4 + 3] = 255
  })
  const texture = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat)
  texture.needsUpdate = true
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  return texture
}

function nightCurve(phase: number) {
  if (phase < 0.36) return 0
  if (phase < 0.52) return (phase - 0.36) / 0.16
  if (phase < 0.9) return 1
  return 1 - (phase - 0.9) / 0.1
}

export class Game {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(46, 1, 0.1, 300)
  private clock = new THREE.Clock()
  private frame = 0
  private keys = new Set<string>()
  private gradient = makeToonGradient()

  private world: World
  private player = new THREE.Group()
  private playerParts: { armL: THREE.Group; armR: THREE.Group; legL: THREE.Group; legR: THREE.Group }
  private kijazo = new THREE.Group()

  private velocity = new THREE.Vector3()
  private walkTime = 0
  private cameraYaw = Math.PI
  private cameraPitch = 0.34
  private cursorLook = new THREE.Vector2()
  private touchVector = { x: 0, y: 0 }
  private paused = false
  private nearTarget: NearTarget = null

  private hemi: THREE.HemisphereLight
  private sun: THREE.DirectionalLight
  private playerLight: THREE.PointLight

  private postScene = new THREE.Scene()
  private postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private postMaterial: THREE.ShaderMaterial
  private renderTarget: THREE.WebGLRenderTarget

  private dayStart = 46
  private dayLength = 170

  constructor(private mount: HTMLDivElement, private callbacks: Callbacks) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.mount.appendChild(this.renderer.domElement)

    this.hemi = new THREE.HemisphereLight(0xfff4d6, 0x4a6a44, 0.95)
    this.scene.add(this.hemi)
    this.sun = new THREE.DirectionalLight(P.sunDay, 2.1)
    this.sun.position.set(-30, 34, -22)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.camera.left = -30
    this.sun.shadow.camera.right = 30
    this.sun.shadow.camera.top = 30
    this.sun.shadow.camera.bottom = -30
    this.sun.shadow.camera.far = 120
    this.sun.shadow.bias = -0.0007
    this.scene.add(this.sun)
    this.playerLight = new THREE.PointLight(0xffc98a, 0, 8, 2)
    this.scene.add(this.playerLight)

    this.world = buildWorld(this.scene, this.gradient)
    this.player = makeMessenger(this.gradient)
    this.playerParts = this.player.userData.parts
    this.player.position.copy(this.world.spawn)
    this.scene.add(this.player)
    this.kijazo = makeKijazo(this.gradient)
    this.kijazo.position.copy(this.world.kijazoPoint)
    this.scene.add(this.kijazo)

    const glow = softCircleTexture()
    this.postMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        vignetteMap: { value: glow },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        varying vec2 vUv;
        float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
        float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
        void main(){
          vec2 wobble = vec2(sin(vUv.y * 240.0 + time * 2.0), cos(vUv.x * 200.0 - time * 1.6)) * 0.0006;
          vec3 color = texture2D(tDiffuse, vUv + wobble).rgb;
          color += (bayer4(gl_FragCoord.xy) - 0.5) / 18.0;
          color = floor(color * 22.0) / 22.0;
          vec2 centered = vUv - vec2(0.5, 0.45);
          float vignette = 1.0 - dot(centered, centered) * 0.85;
          color *= clamp(vignette, 0.5, 1.0);
          color = mix(color, color * vec3(1.05, 0.99, 0.92), 0.45);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.postMaterial)
    this.postScene.add(quad)
    this.renderTarget = new THREE.WebGLRenderTarget(320, 180, {
      magFilter: THREE.NearestFilter,
      minFilter: THREE.NearestFilter,
    })

    window.addEventListener('resize', this.resize)
    window.addEventListener('keydown', this.keyDown)
    window.addEventListener('keyup', this.keyUp)
    window.addEventListener('pointermove', this.pointerMove)
    window.addEventListener('pointerleave', this.pointerLeave)
    document.addEventListener('visibilitychange', this.visibilityChange)
    this.resize()
    this.callbacks.onReady()
    this.animate()
  }

  setPaused(paused: boolean) {
    this.paused = paused
  }

  setTouchVector(vector: { x: number; y: number }) {
    this.touchVector = vector
  }

  interact() {
    if (this.nearTarget) this.callbacks.onInteract(this.nearTarget)
  }

  dispose() {
    cancelAnimationFrame(this.frame)
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('keydown', this.keyDown)
    window.removeEventListener('keyup', this.keyUp)
    window.removeEventListener('pointermove', this.pointerMove)
    window.removeEventListener('pointerleave', this.pointerLeave)
    document.removeEventListener('visibilitychange', this.visibilityChange)
    this.renderer.dispose()
    this.renderTarget.dispose()
    this.mount.innerHTML = ''
  }

  private visible = true

  private animate = () => {
    this.frame = requestAnimationFrame(this.animate)
    if (!this.visible) return
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const t = this.clock.elapsedTime
    if (!this.paused) this.update(dt, t)
    this.world.update(t, this.nightAmount(t))
    this.updateCycle(t)
    this.postMaterial.uniforms.time.value = t
    this.postMaterial.uniforms.tDiffuse.value = this.renderTarget.texture
    this.renderer.setRenderTarget(this.renderTarget)
    this.renderer.render(this.scene, this.camera)
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.postScene, this.postCamera)
  }

  private nightAmount(t: number) {
    return nightCurve((this.dayStart + t) / this.dayLength % 1)
  }

  private updateCycle(t: number) {
    const phase = (this.dayStart + t) / this.dayLength % 1
    const n = nightCurve(phase)
    const duskMix = n < 0.5 ? n * 2 : 1
    const nightMix = Math.max(0, (n - 0.5) * 2)
    const lerp3 = (a: number, b: number, c: number) => new THREE.Color(a).lerp(new THREE.Color(b), duskMix).lerp(new THREE.Color(c), nightMix)
    ;(this.world.skyMaterial.uniforms.topColor.value as THREE.Color).copy(lerp3(P.skyDayTop, P.duskTop, P.nightTop))
    ;(this.world.skyMaterial.uniforms.bottomColor.value as THREE.Color).copy(lerp3(P.skyDayHorizon, P.duskHorizon, P.nightHorizon))
    this.scene.fog = this.scene.fog ?? new THREE.Fog(P.fogDay, 26, 78)
    const fog = this.scene.fog as THREE.Fog
    fog.color.copy(lerp3(P.fogDay, P.fogDusk, P.fogNight))
    fog.near = 26 - n * 10
    fog.far = 78 - n * 22

    const ranked = this.world.fires
      .map((fire) => ({ fire, distance: fire.position.distanceTo(this.player.position) }))
      .sort((a, b) => a.distance - b.distance)
    this.world.fireLights.forEach((light, index) => {
      const pick = ranked[index]
      if (!pick || pick.distance > 26) {
        light.intensity = 0
        return
      }
      light.position.set(pick.fire.position.x, 1.0, pick.fire.position.z)
      light.intensity = (0.35 + n * 3.0) * (0.86 + Math.sin(t * 11 + index * 2.2) * 0.14)
    })
    this.hemi.color.copy(lerp3(0xfff4d6, 0xffd9a8, 0x8ea6c8))
    this.hemi.groundColor.copy(lerp3(0x4a6a44, 0x39503c, 0x0e1a16))
    this.hemi.intensity = 0.95 - n * 0.68
    this.sun.color.copy(lerp3(P.sunDay, P.sunDusk, P.sunNight))
    this.sun.intensity = 2.1 - n * 1.5
    const sunPosition = new THREE.Vector3(-30, 34 - n * 26, -22)
    const moonPosition = new THREE.Vector3(26, 40, 18)
    this.sun.position.copy(sunPosition.lerp(moonPosition, nightMix))
    this.world.lanternLights.forEach((light, index) => {
      light.intensity = (0.35 + n * 2.3) * (0.92 + Math.sin(t * 7 + index * 2.4) * 0.08)
    })
    this.playerLight.intensity = n * 1.35
    this.playerLight.position.copy(this.player.position).add(new THREE.Vector3(0, 2.4, 0))
  }

  private update(dt: number, t: number) {
    const input = new THREE.Vector2(
      Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')),
      Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')),
    )
    input.x += this.touchVector.x
    input.y += this.touchVector.y
    if (input.lengthSq() > 1) input.normalize()

    const running = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')
    const speed = running ? 5.6 : 3.3
    const cameraForward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw))
    const cameraRight = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw))
    const desired = cameraForward.multiplyScalar(input.y).add(cameraRight.multiplyScalar(input.x)).multiplyScalar(speed)
    this.velocity.lerp(desired, 1 - Math.exp(-dt * (input.lengthSq() ? 10 : 14)))

    const next = this.player.position.clone().addScaledVector(this.velocity, dt)
    const radius = Math.hypot(next.x, next.z)
    if (radius > 34) {
      next.multiplyScalar(34 / radius)
    }
    for (const collider of this.world.colliders as Collider[]) {
      const dx = next.x - collider.x
      const dz = next.z - collider.z
      const distance = Math.hypot(dx, dz)
      const minimum = collider.r + 0.35
      if (distance < minimum && distance > 0.0001) {
        next.x = collider.x + (dx / distance) * minimum
        next.z = collider.z + (dz / distance) * minimum
      }
    }
    this.player.position.copy(next)

    const moving = this.velocity.length()
    if (moving > 0.1) {
      this.player.rotation.y = THREE.MathUtils.lerp(this.player.rotation.y, Math.atan2(this.velocity.x, this.velocity.z), 0.18)
      this.walkTime += dt * (running ? 11.5 : 8)
    }
    const strength = Math.min(moving / 3.2, 1)
    const swing = Math.sin(this.walkTime) * 0.7 * strength
    this.playerParts.legL.rotation.x = swing
    this.playerParts.legR.rotation.x = -swing
    this.playerParts.armL.rotation.x = -swing * 0.72
    this.playerParts.armR.rotation.x = swing * 0.72

    if (moving > 0.4 && Math.abs(this.cursorLook.x) < 0.35) {
      const followYaw = Math.atan2(-this.velocity.x, -this.velocity.z)
      let delta = followYaw - this.cameraYaw
      delta = Math.atan2(Math.sin(delta), Math.cos(delta))
      this.cameraYaw += delta * (1 - Math.exp(-dt * 1.6))
    }
    this.cameraYaw -= THREE.MathUtils.clamp(this.cursorLook.x, -1, 1) * dt * 1.15 * (Math.abs(this.cursorLook.x) > 0.18 ? 1 : 0)
    this.cameraPitch = THREE.MathUtils.lerp(this.cameraPitch, THREE.MathUtils.clamp(0.34 + this.cursorLook.y * 0.16, 0.12, 0.6), 1 - Math.exp(-dt * 3))

    const focus = this.player.position.clone().add(new THREE.Vector3(0, 1.25, 0))
    const offset = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * 7.4,
      2.6 + Math.sin(this.cameraPitch) * 7.4,
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * 7.4,
    )
    this.camera.position.lerp(focus.clone().add(offset), 1 - Math.exp(-dt * 6.5))
    this.camera.lookAt(focus)

    this.kijazo.position.y = 0.18 + Math.sin(t * 2.1) * 0.09
    if (this.player.position.distanceTo(this.kijazo.position) < 7) {
      const look = Math.atan2(this.player.position.x - this.kijazo.position.x, this.player.position.z - this.kijazo.position.z)
      this.kijazo.rotation.y = THREE.MathUtils.lerp(this.kijazo.rotation.y, look, 0.06)
    }
    const tip = this.kijazo.userData.tipGlow as THREE.Sprite
    tip.material.opacity = 0.6 + Math.sin(t * 3.2) * 0.3

    this.updateProximity()
  }

  private updateProximity() {
    let target: NearTarget = null
    let best = Number.POSITIVE_INFINITY
    if (this.player.position.distanceTo(this.kijazo.position) < 2.3) {
      target = { kind: 'kijazo' }
      best = this.player.position.distanceTo(this.kijazo.position)
    }
    this.world.fires.forEach((fire) => {
      const distance = this.player.position.distanceTo(fire.position)
      if (distance < 2.1 && distance < best) {
        target = { kind: 'essay', index: fire.essayIndex }
        best = distance
      }
    })
    const changed = JSON.stringify(target) !== JSON.stringify(this.nearTarget)
    if (changed) {
      this.nearTarget = target
      this.callbacks.onNear(target)
    }
  }

  private keyDown = (event: KeyboardEvent) => {
    this.keys.add(event.code)
    if ((event.code === 'KeyE' || event.code === 'Enter') && this.nearTarget && !this.paused) this.interact()
  }

  private keyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code)
  }

  private pointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    this.cursorLook.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1)
  }

  private pointerLeave = () => {
    this.cursorLook.set(0, 0)
  }

  private visibilityChange = () => {
    this.visible = document.visibilityState === 'visible'
    if (this.visible) this.clock.getDelta()
  }

  private resize = () => {
    const width = this.mount.clientWidth
    const height = this.mount.clientHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    const pixelWidth = Math.max(320, Math.round(width * 0.34))
    const pixelHeight = Math.max(180, Math.round(height * 0.34))
    this.renderTarget.setSize(pixelWidth, pixelHeight)
  }
}
