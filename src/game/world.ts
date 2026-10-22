import * as THREE from 'three'
import { P } from './palette'
import { meadowTexture, dirtTexture, softCircleTexture, cloudTexture, flameTexture } from './textures'
import { essays, regions } from './essays'

export type FireHub = {
  essayIndex: number
  position: THREE.Vector3
  glow: THREE.Sprite
  flames: THREE.Sprite[]
  smoke: THREE.Sprite
}

export type Collider = { x: number; z: number; r: number }

export type World = {
  group: THREE.Group
  fires: FireHub[]
  fireLights: THREE.PointLight[]
  colliders: Collider[]
  lanternLights: THREE.PointLight[]
  fireflies: THREE.Points
  stars: THREE.Points
  clouds: THREE.Sprite[]
  moon: THREE.Sprite
  moonShadow: THREE.Sprite
  sun: THREE.Sprite
  skyMaterial: THREE.ShaderMaterial
  grassMaterial: THREE.MeshToonMaterial
  spawn: THREE.Vector3
  kijazoPoint: THREE.Vector3
  update(t: number, night: number): void
}

const POND = { x: -5, z: 19, r: 3.1 }

function toonMaterial(color: number, gradient: THREE.DataTexture) {
  return new THREE.MeshToonMaterial({ color, gradientMap: gradient })
}

function makeBladeGeometry() {
  const geometry = new THREE.BufferGeometry()
  const height = 0.62
  const levels = 4
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  const root = new THREE.Color(0.42, 0.52, 0.34)
  const tip = new THREE.Color(1.05, 1.05, 0.82)
  for (let level = 0; level <= levels; level += 1) {
    const fraction = level / levels
    const y = height * fraction
    const width = 0.055 * (1 - fraction * 0.82)
    const bend = fraction * fraction * 0.16
    const color = root.clone().lerp(tip, fraction)
    if (level === levels) {
      positions.push(bend, y, 0)
      colors.push(color.r, color.g, color.b)
    } else {
      positions.push(-width + bend, y, 0, width + bend, y, 0)
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b)
    }
    if (level > 0) {
      const previous = level === levels ? null : null
      void previous
      if (level < levels) {
        const currentBase = (level - 1) * 2
        indices.push(currentBase, currentBase + 1, currentBase + 2, currentBase + 1, currentBase + 3, currentBase + 2)
      } else {
        const currentBase = (levels - 1) * 2
        indices.push(currentBase, currentBase + 1, currentBase + 2)
      }
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((levels) * 2 * 2).fill(0), 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function ribbonGeometry(points: THREE.Vector3[], width: number) {
  const curve = new THREE.CatmullRomCurve3(points)
  const samples = curve.getPoints(70)
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const up = new THREE.Vector3(0, 1, 0)
  let distance = 0
  samples.forEach((point, index) => {
    if (index > 0) distance += point.distanceTo(samples[index - 1])
    const tangent = curve.getTangent(index / (samples.length - 1))
    const side = new THREE.Vector3().crossVectors(up, tangent).normalize().multiplyScalar(width / 2)
    positions.push(point.x - side.x, point.y + 0.02, point.z - side.z)
    positions.push(point.x + side.x, point.y + 0.02, point.z + side.z)
    uvs.push(0, distance / 2.2, 1, distance / 2.2)
    if (index > 0) {
      const a = (index - 1) * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function labelSprite(text: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgba(30, 26, 20, 0.78)'
  ctx.beginPath()
  ctx.roundRect(60, 26, 392, 76, 16)
  ctx.fill()
  ctx.strokeStyle = 'rgba(243, 234, 210, 0.55)'
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.fillStyle = '#f3ead2'
  ctx.font = '600 34px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 66)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }))
  sprite.scale.set(3.4, 0.85, 1)
  return sprite
}

export function buildWorld(scene: THREE.Scene, gradient: THREE.DataTexture): World {
  const group = new THREE.Group()
  const colliders: Collider[] = []
  const fires: FireHub[] = []
  const lanternLights: THREE.PointLight[] = []
  const fireLights: THREE.PointLight[] = []

  const meadow = meadowTexture()
  meadow.repeat.set(14, 14)
  const terrainGeometry = new THREE.CircleGeometry(38, 72)
  terrainGeometry.rotateX(-Math.PI / 2)
  const terrainPositions = terrainGeometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < terrainPositions.count; i += 1) {
    const x = terrainPositions.getX(i)
    const z = terrainPositions.getZ(i)
    const r = Math.hypot(x, z)
    const rim = THREE.MathUtils.smoothstep(r, 27, 37) * 3.2
    const bumps = r > 22 ? (Math.sin(x * 0.7) * Math.cos(z * 0.6)) * 0.22 * (r / 38) : 0
    terrainPositions.setY(i, rim + bumps)
  }
  terrainGeometry.computeVertexNormals()
  const terrain = new THREE.Mesh(terrainGeometry, toonMaterial(P.grassA, gradient))
  const terrainMaterial = terrain.material as THREE.MeshToonMaterial
  terrainMaterial.map = meadow
  terrainMaterial.color.set(0xffffff)
  terrain.receiveShadow = true
  group.add(terrain)

  const trailhead = new THREE.Vector3(0, 0, 6)
  regions.slice(1).forEach((region) => {
    const start = new THREE.Vector3(trailhead.x, 0, trailhead.z)
    const end = new THREE.Vector3(region.center[0], 0, region.center[1])
    const mid1 = start.clone().lerp(end, 0.35)
    mid1.x += (end.z - start.z) * 0.18
    mid1.z -= (end.x - start.x) * 0.18
    const mid2 = start.clone().lerp(end, 0.7)
    mid2.x -= (end.z - start.z) * 0.14
    mid2.z += (end.x - start.x) * 0.14
    const path = new THREE.Mesh(
      ribbonGeometry([start, mid1, mid2, end], 1.25),
      (() => {
        const material = toonMaterial(0xffffff, gradient)
        material.map = dirtTexture()
        return material
      })(),
    )
    path.receiveShadow = true
    group.add(path)
  })

  const pondGeometry = new THREE.CircleGeometry(POND.r, 44)
  pondGeometry.rotateX(-Math.PI / 2)
  const pondUniforms = { time: { value: 0 } }
  const pond = new THREE.Mesh(
    pondGeometry,
    new THREE.ShaderMaterial({
      uniforms: pondUniforms,
      vertexShader: `
        varying vec2 vXZ;
        void main(){
          vec4 world = modelMatrix * vec4(position, 1.0);
          vXZ = world.xz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vXZ;
        void main(){
          vec2 local = vXZ - vec2(${POND.x.toFixed(1)}, ${POND.z.toFixed(1)});
          float r = length(local) / ${POND.r.toFixed(1)};
          vec3 deep = vec3(0.09, 0.24, 0.26);
          vec3 shallow = vec3(0.24, 0.47, 0.44);
          vec3 color = mix(deep, shallow, r * 0.9);
          float ripple = sin(local.x * 2.4 + time * 1.3) * sin(local.y * 2.1 - time * 1.1);
          color += ripple * 0.035;
          float ring = sin(r * 22.0 - time * 2.4) * 0.5 + 0.5;
          color += smoothstep(0.75, 1.0, r) * ring * 0.06;
          float edge = smoothstep(0.86, 1.0, r + sin(atan(local.y, local.x) * 9.0 + time * 0.8) * 0.03);
          color = mix(color, vec3(0.82, 0.86, 0.76), edge * 0.7);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
  )
  pond.position.set(POND.x, 0.035, POND.z)
  group.add(pond)
  colliders.push({ x: POND.x, z: POND.z, r: POND.r + 0.3 })
  const rimStoneMaterial = toonMaterial(P.rock, gradient)
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 + Math.random() * 0.14, 0), rimStoneMaterial)
    stone.position.set(POND.x + Math.cos(angle) * (POND.r + 0.25), 0.1, POND.z + Math.sin(angle) * (POND.r + 0.25))
    stone.rotation.set(Math.random(), Math.random(), 0)
    stone.castShadow = true
    group.add(stone)
  }

  const grassCount = 38000
  const bladeGeometry = makeBladeGeometry()
  const grassMaterial = new THREE.MeshToonMaterial({
    vertexColors: true,
    gradientMap: gradient,
    side: THREE.DoubleSide,
  })
  grassMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
        float swayPhase = instanceMatrix[3][0] * 1.7 + instanceMatrix[3][2] * 2.3;
        float swayHeight = max(position.y, 0.0);
        transformed.x += sin(uTime * 1.8 + swayPhase) * 0.12 * swayHeight;
        transformed.z += cos(uTime * 1.35 + swayPhase) * 0.09 * swayHeight;
        #endif`)
    grassMaterial.userData.shader = shader
  }
  const grass = new THREE.InstancedMesh(bladeGeometry, grassMaterial, grassCount)
  const dummy = new THREE.Object3D()
  const pathPoints: THREE.Vector3[] = []
  regions.slice(1).forEach((region) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(trailhead.x, 0, trailhead.z),
      new THREE.Vector3(region.center[0], 0, region.center[1]),
    ])
    for (let i = 0; i <= 20; i += 1) pathPoints.push(curve.getPoint(i / 20))
  })
  const tintA = new THREE.Color(0xd8e8c0)
  const tintB = new THREE.Color(0xffffff)
  const tintC = new THREE.Color(0xbcd8a0)
  let placed = 0
  let attempt = 0
  while (placed < grassCount && attempt < grassCount * 4) {
    attempt += 1
    const angle = Math.random() * Math.PI * 2
    const radius = Math.sqrt(Math.random()) * 33.5
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    if (pathPoints.some((point) => Math.hypot(point.x - x, point.z - z) < 1.15)) continue
    if (regions.some((region) => Math.hypot(region.center[0] - x, region.center[1] - z) < 2.6)) continue
    if (Math.hypot(trailhead.x - x, trailhead.z - z) < 3.2) continue
    if (Math.hypot(POND.x - x, POND.z - z) < POND.r + 0.5) continue
    dummy.position.set(x, 0, z)
    dummy.rotation.set(0, Math.random() * Math.PI, 0)
    const scale = 0.7 + Math.random() * 0.85
    dummy.scale.set(scale, scale * (0.75 + Math.random() * 0.7), scale)
    dummy.updateMatrix()
    grass.setMatrixAt(placed, dummy.matrix)
    const pick = Math.random()
    grass.setColorAt(placed, pick < 0.4 ? tintA : pick < 0.75 ? tintB : tintC)
    placed += 1
  }
  grass.count = placed
  grass.instanceMatrix.needsUpdate = true
  group.add(grass)

  const flowerGeometry = new THREE.SphereGeometry(0.035, 5, 4)
  const flowerMaterial = new THREE.MeshBasicMaterial({ vertexColors: false })
  const flowerCount = 420
  const flowers = new THREE.InstancedMesh(flowerGeometry, flowerMaterial, flowerCount)
  const flowerColors = [0xfff6dd, 0xffd9a0, 0xe8a0b4, 0xf2e26a, 0xdce8f2]
  let flowerPlaced = 0
  let flowerAttempt = 0
  while (flowerPlaced < flowerCount && flowerAttempt < flowerCount * 5) {
    flowerAttempt += 1
    const angle = Math.random() * Math.PI * 2
    const radius = Math.sqrt(Math.random()) * 31
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    if (pathPoints.some((point) => Math.hypot(point.x - x, point.z - z) < 1.3)) continue
    if (Math.hypot(POND.x - x, POND.z - z) < POND.r + 0.4) continue
    dummy.position.set(x, 0.07, z)
    dummy.rotation.set(0, 0, 0)
    const scale = 0.7 + Math.random() * 0.9
    dummy.scale.setScalar(scale)
    dummy.updateMatrix()
    flowers.setMatrixAt(flowerPlaced, dummy.matrix)
    flowers.setColorAt(flowerPlaced, new THREE.Color(flowerColors[flowerPlaced % flowerColors.length]))
    flowerPlaced += 1
  }
  flowers.count = flowerPlaced
  flowers.instanceMatrix.needsUpdate = true
  group.add(flowers)

  const trunkMaterial = toonMaterial(P.trunk, gradient)
  const canopyMaterials = [
    toonMaterial(P.canopy, gradient),
    toonMaterial(P.canopyLight, gradient),
    toonMaterial(0x35603a, gradient),
  ]
  const rockMaterial = toonMaterial(P.rock, gradient)
  const addTree = (x: number, z: number, scale: number) => {
    const tree = new THREE.Group()
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, 1.7, 6), trunkMaterial)
    trunk.position.y = 0.85
    trunk.castShadow = true
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.15, 10, 7), canopyMaterials[Math.floor(Math.random() * canopyMaterials.length)])
    canopy.position.y = 2.05
    canopy.scale.set(1.5, 0.55, 1.5)
    canopy.castShadow = true
    const canopyTop = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), canopyMaterials[Math.floor(Math.random() * canopyMaterials.length)])
    canopyTop.position.set(0.35, 2.35, 0.1)
    canopyTop.scale.set(1.3, 0.6, 1.3)
    tree.add(trunk, canopy, canopyTop)
    tree.position.set(x, 0, z)
    tree.scale.setScalar(scale)
    group.add(tree)
    colliders.push({ x, z, r: 0.55 * scale })
  }
  for (let i = 0; i < 32; i += 1) {
    const angle = (i / 32) * Math.PI * 2 + Math.random() * 0.2
    const radius = 29 + Math.random() * 6
    addTree(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.9 + Math.random() * 0.7)
  }
  for (let i = 0; i < 12; i += 1) {
    const angle = Math.random() * Math.PI * 2
    const radius = 11 + Math.random() * 13
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    if (regions.some((region) => Math.hypot(region.center[0] - x, region.center[1] - z) < 4)) continue
    if (Math.hypot(POND.x - x, POND.z - z) < POND.r + 2) continue
    addTree(x, z, 0.65 + Math.random() * 0.45)
  }
  for (let i = 0; i < 24; i += 1) {
    const angle = Math.random() * Math.PI * 2
    const radius = 8 + Math.random() * 24
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    if (Math.hypot(POND.x - x, POND.z - z) < POND.r + 0.6) continue
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22 + Math.random() * 0.4, 0), rockMaterial)
    rock.position.set(x, 0.12, z)
    rock.rotation.set(Math.random(), Math.random(), Math.random())
    rock.castShadow = true
    group.add(rock)
  }

  const hillMaterial = toonMaterial(0x2c4436, gradient)
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2 + 0.4
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), hillMaterial)
    hill.position.set(Math.cos(angle) * 45, -1.5, Math.sin(angle) * 45)
    hill.scale.set(12 + Math.random() * 8, 4.5 + Math.random() * 3.5, 9 + Math.random() * 5)
    group.add(hill)
  }

  const glowTexture = softCircleTexture()
  const fireTexture = flameTexture()
  const glowMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: P.fire, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending })
  const smokeMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: 0xb9c0bb, transparent: true, opacity: 0, depthWrite: false })

  const addCampfire = (x: number, z: number, essayIndex: number, withBenches: boolean) => {
    const fire = new THREE.Group()
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13, 0), rockMaterial)
      stone.position.set(Math.cos(angle) * 0.42, 0.08, Math.sin(angle) * 0.42)
      stone.rotation.set(Math.random(), Math.random(), 0)
      fire.add(stone)
    }
    const logGeometry = new THREE.CylinderGeometry(0.07, 0.09, 0.85, 6)
    for (const rotation of [0.5, 1.6, 2.7]) {
      const log = new THREE.Mesh(logGeometry, trunkMaterial)
      log.rotation.set(Math.PI / 2.4, rotation, 0)
      log.position.y = 0.12
      log.castShadow = true
      fire.add(log)
    }
    group.add(fire)

    const glow = new THREE.Sprite(glowMaterial.clone())
    glow.position.set(x, 0.4, z)
    glow.scale.set(2.6, 2.6, 1)
    group.add(glow)

    const flames: THREE.Sprite[] = []
    for (let i = 0; i < 7; i += 1) {
      const flame = new THREE.Sprite(new THREE.SpriteMaterial({
        map: fireTexture,
        color: i % 3 === 0 ? 0xffe9b0 : i % 3 === 1 ? 0xffb35c : 0xff8a3a,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }))
      flame.position.set(x, 0.4, z)
      group.add(flame)
      flames.push(flame)
    }
    const smoke = new THREE.Sprite(smokeMaterial.clone())
    smoke.position.set(x, 0.6, z)
    group.add(smoke)

    if (withBenches) {
      for (const angle of [0.8, 2.4, 4.2, 5.6]) {
        const bench = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.05, 7), trunkMaterial)
        bench.rotation.set(Math.PI / 2, 0, angle)
        bench.position.set(x + Math.cos(angle) * 1.15, 0.22, z + Math.sin(angle) * 1.15)
        bench.castShadow = true
        group.add(bench)
      }
    }

    fires.push({
      essayIndex,
      position: new THREE.Vector3(x, 0, z),
      glow,
      flames,
      smoke,
    })
  }

  for (let i = 0; i < 6; i += 1) {
    const light = new THREE.PointLight(P.fire, 0, 11, 2)
    scene.add(light)
    fireLights.push(light)
  }

  const tentMaterial = toonMaterial(P.tent, gradient)
  const addTent = (x: number, z: number, rotation: number) => {
    const tent = new THREE.Group()
    const shape = new THREE.Shape()
    shape.moveTo(-1, 0)
    shape.lineTo(0, 1.15)
    shape.lineTo(1, 0)
    shape.closePath()
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 1.7, bevelEnabled: false })
    geometry.translate(0, 0, -0.85)
    const body = new THREE.Mesh(geometry, tentMaterial)
    body.rotation.y = Math.PI / 2
    body.castShadow = true
    const doorway = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.86),
      new THREE.MeshBasicMaterial({ color: P.tentGlow, transparent: true, opacity: 0.92 }),
    )
    doorway.position.set(0, 0.44, 0.88)
    const doorwayGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: P.tentGlow, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }))
    doorwayGlow.position.set(0, 0.5, 1.15)
    doorwayGlow.scale.set(1.8, 1.8, 1)
    tent.add(body, doorway, doorwayGlow)
    tent.position.set(x, 0, z)
    tent.rotation.y = rotation
    group.add(tent)
    colliders.push({ x, z, r: 1.25 })
  }

  const addLantern = (x: number, z: number) => {
    const lantern = new THREE.Group()
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 2.3, 6), trunkMaterial)
    pole.position.y = 1.15
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), trunkMaterial)
    arm.position.set(0.2, 2.25, 0)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), toonMaterial(P.ink, gradient))
    head.position.set(0.42, 2.05, 0)
    const lightGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.2), new THREE.MeshBasicMaterial({ color: P.lantern }))
    lightGlass.position.set(0.42, 2.05, 0.115)
    const bulbGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: P.lantern, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }))
    bulbGlow.position.set(0.42, 2.05, 0)
    bulbGlow.scale.set(1.5, 1.5, 1)
    const light = new THREE.PointLight(P.lantern, 0, 9, 2)
    light.position.set(0.42, 2.05, 0)
    lantern.add(pole, arm, head, lightGlass, bulbGlow, light)
    lantern.position.set(x, 0, z)
    lantern.rotation.y = Math.random() * Math.PI * 2
    group.add(lantern)
    lanternLights.push(light)
    colliders.push({ x, z, r: 0.3 })
  }

  regions.forEach((region, regionIndex) => {
    const [cx, cz] = region.center
    const sign = new THREE.Group()
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.5, 6), trunkMaterial)
    post.position.y = 0.75
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 0.06), toonMaterial(0x8a6a44, gradient))
    board.position.y = 1.45
    sign.add(post, board)
    sign.position.set(cx + 1.4, 0, cz + 1.4)
    group.add(sign)

    const label = labelSprite(region.name)
    label.position.set(cx + 1.4, 2.35, cz + 1.4)
    label.scale.set(3, 0.75, 1)
    group.add(label)

    if (regionIndex === 0) {
      addCampfire(cx, cz, -1, true)
      addLantern(cx - 2.2, cz - 1.6)
      addLantern(cx + 2.4, cz + 1.2)
      addTent(cx - 3.4, cz + 2.2, -0.7)
      addTent(cx + 3.2, cz - 2.4, 2.4)
    } else {
      addTent(cx - 2.2, cz + 1.8, Math.random() * Math.PI)
      addLantern(cx + 1.8, cz - 1.6)
      essays
        .map((essay, index) => ({ essay, index }))
        .filter(({ essay }) => essay.territory === region.id)
        .forEach(({ essay, index }, fireIndex) => {
          const angle = (fireIndex / 3) * Math.PI * 2 + regionIndex
          addCampfire(cx + Math.cos(angle) * 3.1, cz + Math.sin(angle) * 3.1, index, fireIndex === 0)
        })
    }
  })

  const emberCount = fires.length * 7
  const emberPositions = new Float32Array(emberCount * 3)
  const emberGeometry = new THREE.BufferGeometry()
  emberGeometry.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3))
  const embers = new THREE.Points(emberGeometry, new THREE.PointsMaterial({
    color: 0xffb066,
    size: 0.09,
    map: glowTexture,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }))
  group.add(embers)

  const fireflyCount = 120
  const fireflyPositions = new Float32Array(fireflyCount * 3)
  const fireflySeeds: Array<[number, number, number, number]> = []
  for (let i = 0; i < fireflyCount; i += 1) {
    const angle = Math.random() * Math.PI * 2
    const radius = 4 + Math.random() * 25
    const seed: [number, number, number, number] = [Math.cos(angle) * radius, 0.4 + Math.random() * 1.5, Math.sin(angle) * radius, Math.random() * Math.PI * 2]
    fireflySeeds.push(seed)
    fireflyPositions.set([seed[0], seed[1], seed[2]], i * 3)
  }
  const fireflyGeometry = new THREE.BufferGeometry()
  fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3))
  const firefliesMaterial = new THREE.PointsMaterial({
    color: 0xd8f27e,
    size: 0.16,
    map: glowTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })
  const fireflies = new THREE.Points(fireflyGeometry, firefliesMaterial)
  group.add(fireflies)

  const starCount = 520
  const starPositions = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i += 1) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI * 0.42
    starPositions.set([
      Math.cos(theta) * Math.sin(phi + 0.12) * 105,
      Math.cos(phi) * 105 * 0.9 + 8,
      Math.sin(theta) * Math.sin(phi + 0.12) * 105,
    ], i * 3)
  }
  const starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  const starsMaterial = new THREE.PointsMaterial({ color: 0xdfe8ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false })
  const stars = new THREE.Points(starGeometry, starsMaterial)
  group.add(stars)

  const clouds: THREE.Sprite[] = []
  const cloudMap = cloudTexture()
  for (let i = 0; i < 7; i += 1) {
    const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudMap, transparent: true, opacity: 0.85, depthWrite: false }))
    cloud.position.set(-50 + i * 16 + Math.random() * 8, 20 + Math.random() * 8, -40 + Math.random() * 70)
    const scale = 16 + Math.random() * 12
    cloud.scale.set(scale, scale * 0.45, 1)
    clouds.push(cloud)
    group.add(cloud)
  }

  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xe8f0f8, transparent: true, opacity: 0, depthWrite: false }))
  moon.position.set(42, 46, -58)
  moon.scale.set(11, 11, 1)
  group.add(moon)
  const moonShadow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0x0d1620, transparent: true, opacity: 0, depthWrite: false }))
  moonShadow.position.set(43.6, 47.2, -57.4)
  moonShadow.scale.set(9.4, 9.4, 1)
  group.add(moonShadow)

  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xffe6ae, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }))
  sun.position.set(-48, 30, -34)
  sun.scale.set(18, 18, 1)
  group.add(sun)

  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(P.skyDayTop) },
      bottomColor: { value: new THREE.Color(P.skyDayHorizon) },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; varying vec3 vP; void main(){ float h = normalize(vP).y * 0.5 + 0.5; gl_FragColor = vec4(mix(bottomColor, topColor, smoothstep(0.02, 0.55, h)), 1.0); }',
  })
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 24, 16), skyMaterial)
  group.add(sky)

  scene.add(group)

  return {
    group,
    fires,
    fireLights,
    colliders,
    lanternLights,
    fireflies,
    stars,
    clouds,
    moon,
    moonShadow,
    sun,
    skyMaterial,
    grassMaterial,
    spawn: new THREE.Vector3(0, 0, 11),
    kijazoPoint: new THREE.Vector3(1.6, 0, 4.6),
    update(t, night) {
      if (grassMaterial.userData.shader) {
        ;(grassMaterial.userData.shader as { uniforms: { uTime: { value: number } } } | undefined)!.uniforms.uTime.value = t
      }
      pondUniforms.time.value = t
      const duskBell = 1 - Math.abs(night * 2 - 1)
      const cloudColor = new THREE.Color(0xffffff).lerp(new THREE.Color(0xf2b49a), duskBell).lerp(new THREE.Color(0x232e38), night)
      fires.forEach((fire) => {
        const flicker = 0.85 + Math.sin(t * 11 + fire.position.x * 7) * 0.12 + Math.sin(t * 23 + fire.position.z * 3) * 0.06
        fire.glow.scale.set(2.6 * flicker, 2.6 * flicker, 1)
        ;(fire.glow.material as THREE.SpriteMaterial).opacity = (0.3 + night * 0.3) * flicker
        fire.flames.forEach((flame, index) => {
          const life = ((t * 1.35 + index / fire.flames.length) + fire.position.x * 0.13) % 1
          const rise = life * 1.05
          flame.position.set(
            fire.position.x + Math.sin(life * 8 + index * 2.4) * 0.07 * (1 - life),
            0.28 + rise,
            fire.position.z + Math.cos(life * 6 + index * 1.7) * 0.055 * (1 - life),
          )
          const scale = (1 - life) * (0.62 + flicker * 0.26)
          flame.scale.set(scale, scale * 1.7, 1)
          ;(flame.material as THREE.SpriteMaterial).opacity = Math.min(1, (1 - life) * 1.5)
        })
        const smokeLife = (t * 0.16 + fire.position.z * 0.21) % 1
        fire.smoke.position.set(fire.position.x + smokeLife * 0.7, 1.2 + smokeLife * 2.4, fire.position.z)
        ;(fire.smoke.material as THREE.SpriteMaterial).opacity = 0.15 * (1 - smokeLife) * Math.min(1, smokeLife * 6)
      })
      const emberAttribute = embers.geometry.attributes.position as THREE.BufferAttribute
      fires.forEach((fire, fireIndex) => {
        for (let i = 0; i < 7; i += 1) {
          const life = ((t * 0.45 + i / 7 + fireIndex * 0.37) % 1)
          emberAttribute.setXYZ(
            fireIndex * 7 + i,
            fire.position.x + Math.sin(life * 12 + i * 3) * 0.22 * life,
            0.4 + life * 1.7,
            fire.position.z + Math.cos(life * 9 + i * 2) * 0.2 * life,
          )
        }
      })
      emberAttribute.needsUpdate = true
      ;(embers.material as THREE.PointsMaterial).opacity = 0.35 + night * 0.55
      const fireflyAttribute = fireflies.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < fireflySeeds.length; i += 1) {
        const [bx, by, bz, phase] = fireflySeeds[i]
        fireflyAttribute.setXYZ(
          i,
          bx + Math.sin(t * 0.5 + phase) * 1.1,
          by + Math.sin(t * 0.9 + phase * 2.1) * 0.4,
          bz + Math.cos(t * 0.4 + phase * 1.3) * 1.1,
        )
      }
      fireflyAttribute.needsUpdate = true
      firefliesMaterial.opacity = night * 0.95
      starsMaterial.opacity = night * 0.95
      ;(moon.material as THREE.SpriteMaterial).opacity = night * 0.95
      ;(moonShadow.material as THREE.SpriteMaterial).opacity = night * 0.95
      ;(sun.material as THREE.SpriteMaterial).opacity = (1 - night) * 0.85
      clouds.forEach((cloud, index) => {
        cloud.position.x += 0.1 + (index % 3) * 0.04
        if (cloud.position.x > 62) cloud.position.x = -62
        const material = cloud.material as THREE.SpriteMaterial
        material.color.copy(cloudColor)
        material.opacity = 0.88 - night * 0.72
      })
    },
  }
}
