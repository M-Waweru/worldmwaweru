import * as THREE from 'three'
import { gardenIndex } from '../game/essays'
import { makeKijazo } from '../game/characters'
import { districts, placeEntries, trails, type DistrictId, type GardenPlant } from './map'
import { heightAt, riverX, shoreline, snowAt, BRIDGES, type Collider } from './engine/terrain'
import { NativeKit, seeded } from './native/kit'
import { homestead, pavilion, workshop, archive, waterfront, boat, bench, tree, resident, gardenWall, planter } from './native/architecture'
import { createGardenWater } from './water'
import { buildLivingGarden } from './living'
import { environmentProfile, type GardenEnvironment } from './environment'

export type WorldTarget = { id: string; kind: 'essay' | 'guide' | 'district'; title: string; x: number; y: number; z: number; radius: number; slug?: string; district?: DistrictId }
export type Landscape = {
  group: THREE.Group
  terrain: THREE.Mesh
  colliders: Collider[]
  targets: WorldTarget[]
  plants: GardenPlant[]
  kijazo: THREE.Group
  gradient: THREE.DataTexture
  statistics: Record<string, number>
  update(time: number, night: number, player: THREE.Vector3, animate: boolean, dt: number, environment?: GardenEnvironment): void
  dispose(): void
}

export function distanceToTrail(x: number, z: number) {
  let closest = Infinity
  for (const trail of trails) for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1], b = trail[i], dx = b[0] - a[0], dz = b[1] - a[1]
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)))
    closest = Math.min(closest, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t))
  }
  return closest
}

function buildTerrain(kit: NativeKit) {
  const geometry = new THREE.PlaneGeometry(120, 120, 128, 128)
  geometry.rotateX(-Math.PI / 2)
  const vertices = geometry.attributes.position as THREE.BufferAttribute
  const colors: number[] = []
  const grass = new THREE.Color(0x8ba969), sand = new THREE.Color(0xc5b895), snow = new THREE.Color(0xf0f1f2), red = new THREE.Color(0xae8661)
  const color = new THREE.Color()
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), z = vertices.getZ(i), y = heightAt(x, z)
    vertices.setY(i, y)
    color.copy(grass)
    const variation = Math.sin(x * .4) * Math.cos(z * .33) * .05
    color.offsetHSL(variation * .15, variation, variation)
    color.lerp(red, Math.exp(-((x - 17) ** 2 + (z - 21) ** 2) / 180) * .5)
    color.lerp(sand, Math.max(0, Math.min(1, (z - shoreline(x) + 7) / 7)))
    color.lerp(sand, 1 - Math.min(1, distanceToTrail(x, z) / 1.45))
    color.lerp(snow, snowAt(x, z))
    colors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.computeVertexNormals()
  const material = kit.material(0xffffff, 'earth')
  material.vertexColors = true
  const terrain = new THREE.Mesh(geometry, material)
  terrain.receiveShadow = true
  return terrain
}

function waterGeometry() {
  const positions: number[] = [], uv: number[] = [], indices: number[] = []
  // One continuous water surface, including the river mouth and open coast.
  for (let i = 0; i <= 100; i++) {
    const z = -33 + i * .7, x = riverX(z)
    positions.push(x - 1.68, .43, z, x + 1.68, .43, z); uv.push(0, i / 10, 1, i / 10)
    if (i < 100) indices.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3)
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals()
  return geometry
}

export function buildLandscape(scene: THREE.Scene): Landscape {
  const group = new THREE.Group(); scene.add(group)
  const kit = new NativeKit(), colliders: Collider[] = [], targets: WorldTarget[] = []
  const terrain = buildTerrain(kit); group.add(terrain)
  const water = createGardenWater(), waterTime = water.uniforms.time
  const creek = new THREE.Mesh(waterGeometry(), water.material); creek.renderOrder = 2; group.add(creek)
  const seaGeometry = new THREE.PlaneGeometry(150, 90, 32, 24); seaGeometry.rotateX(-Math.PI / 2)
  const sea = new THREE.Mesh(seaGeometry, water.material); sea.position.set(0, .43, 80); sea.renderOrder = 2; group.add(sea)
  const seabed = new THREE.Mesh(new THREE.PlaneGeometry(150, 90).rotateX(-Math.PI / 2), kit.material(0xa6b593, 'earth')); seabed.position.set(0, -1.7, 80); group.add(seabed)

  homestead(kit, 0, 5)
  pavilion(kit, -20, -22)
  workshop(kit, 22, -5)
  archive(kit, -26, 3)
  waterfront(kit, 16, 24)
  homestead(kit, 23, -30, true)
  const boatKit = new NativeKit(), mooredBoat = new THREE.Group()
  boat(boatKit, 0, 0); boatKit.commit(mooredBoat); mooredBoat.position.set(21, 0, 36); group.add(mooredBoat)
  // Planted rocks, sponges, and reed-like coral make the clear coastal water a habitat.
  for (const [x, z] of [[9, 39], [24, 42], [-2, 41], [33, 45]]) {
    kit.ball(x, -.47, z, 1.2, .22, .8, 0x98aca0, 'stone')
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4, dx = Math.cos(a) * .65, dz = Math.sin(a) * .5
      kit.cylinder(x + dx, -.24, z + dz, .07, .13, .38 + i % 3 * .08, [0xa18aaa, 0xb4ac73, 0x799789][i % 3], 8)
    }
  }
  for (const [x, z, w, d] of [[-18, -16, 11, 5.5], [21, 1, 10, 4.5], [-25, 9, 10, 5], [14, 28.6, 19, 4.1]]) kit.box(x, heightAt(x, z) - .045, z, w, .09, d, 0xb8b7a2, 'paving')
  gardenWall(kit, 8, 8, 5); gardenWall(kit, -34, 7, 6)
  colliders.push({ kind: 'box', x: 8, z: 8, w: 5.5, d: .6 }, { kind: 'box', x: -34, z: 7, w: 6.5, d: .6 })
  for (const [x, z] of [[-3.6, 8.1], [3.6, 8.1], [18.1, -1.8], [-22.7, 7.8]]) planter(kit, x, z)
  // A garden cart and neatly stacked tools add small, legible human stories.
  const cartX = 10.5, cartZ = 17.3, cartY = heightAt(cartX, cartZ)
  kit.box(cartX, cartY + .48, cartZ, 1.5, .14, .85, 0xa77f51, 'wood')
  for (const side of [-1, 1]) {
    kit.box(cartX + side * .68, cartY + .68, cartZ, .09, .35, .91, 0xa77f51, 'wood')
    const wheel = new THREE.CylinderGeometry(.23, .23, .08, 10)
    kit.add(wheel, 0x5e6450, [cartX + side * .73, cartY + .25, cartZ], [1, 1, 1], [0, 0, Math.PI / 2], 'plain', true); wheel.dispose()
    kit.box(cartX + side * .48, cartY + .43, cartZ + 1, .07, .08, 1.2, 0x8a704e, 'wood', [-.12, 0, 0])
  }
  for (const district of districts) {
    colliders.push(district.id === 'knowledge' ? { kind: 'circle', x: district.center[0], z: district.center[1], r: 4.4 } : { kind: 'box', x: district.center[0], z: district.center[1], w: district.id === 'africa' ? 17 : district.id === 'building' ? 8.7 : 7.3, d: district.id === 'africa' ? 5 : 5.9 })
    const [x, z] = district.entrance
    targets.push({ id: `district:${district.id}`, kind: 'district', title: district.landmark, district: district.id, x, y: heightAt(x, z), z, radius: 3 })
    kit.box(x - 1.5, heightAt(x - 1.5, z) + .9, z, .1, 1.8, .1, 0x756547)
    kit.box(x - 1.5, heightAt(x - 1.5, z) + 1.55, z, 1.35, .42, .12, 0xb3a277)
    bench(kit, x + 3, z + .5)
  }
  // River crossings are native decks over the same terrain used by navigation.
  for (const z of BRIDGES) {
    const x = riverX(z)
    for (let i = 0; i < 16; i++) kit.box(x - 3.5 + i * .45, 1.39, z, .42, .15, 1.85, 0xa89063, 'wood')
    for (const side of [-1, 1]) {
      kit.box(x, 2.1, z + side * .92, 7.2, .1, .1, 0x7b684c)
      for (const dx of [-3.3, -1.1, 1.1, 3.3]) kit.box(x + dx, 1.85, z + side * .92, .1, 1.1, .1, 0x7b684c)
    }
  }
  // Planted nursery: the many young, unclassified notes have a meaningful home.
  for (let row = 0; row < 10; row++) kit.box(4, heightAt(4, 17 + row * .8) + .02, 17 + row * .8, 11, .07, .56, 0x93704e)
  const plants = placeEntries(gardenIndex)
  const fireGroups: THREE.Group[] = []
  for (const plant of plants) {
    const { x, z } = plant, y = heightAt(x, z)
    targets.push({ id: `essay:${plant.slug}`, kind: 'essay', title: plant.title, slug: plant.slug, x, y, z, radius: plant.status === 'seed' ? 1.25 : 2.1 })
    if (plant.status === 'seed') {
      kit.branch(new THREE.Vector3(x, y, z), new THREE.Vector3(x + .03, y + .28, z), .018, 0x537b42)
      kit.ball(x - .09, y + .2, z, .13, .045, .065, 0x73a65b)
      kit.ball(x + .1, y + .25, z, .13, .045, .065, 0x5e9051)
    } else if (plant.status === 'budding') {
      kit.branch(new THREE.Vector3(x, y, z), new THREE.Vector3(x, y + .75, z), .023, 0x567c44)
      kit.ball(x, y + .77, z, .17, .21, .17, 0xd3a188, 'plain')
      kit.ball(x - .13, y + .35, z, .2, .07, .1, 0x6e9754)
      kit.ball(x + .14, y + .48, z, .2, .07, .1, 0x6e9754)
    } else {
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2
        kit.ball(x + Math.cos(a) * .43, y + .12, z + Math.sin(a) * .43, .16, .12, .15, 0xa6ada0, 'plain')
      }
      for (const side of [-1, 1]) kit.box(x, y + .12, z, .85, .14, .18, 0x7e5a3e, 'wood', [0, side * .52, 0])
      const flames = new THREE.Group()
      for (let i = 0; i < 3; i++) {
        const flame = new THREE.Mesh(new THREE.ConeGeometry(.13 + i * .025, .52 + i * .08, 7), new THREE.MeshBasicMaterial({ color: [0xffcc67, 0xe69a43, 0xc77b37][i] }))
        flame.position.set((i - 1) * .12, .4, i % 2 * .09); flames.add(flame)
      }
      flames.position.set(x, y, z); group.add(flames); fireGroups.push(flames)
    }
  }

  const rand = seeded(831)
  const groveRoots: { x: number; z: number }[] = []
  const rockGeometry = new THREE.DodecahedronGeometry(1, 0)
  let treeCount = 0
  for (let attempt = 0; attempt < 1100 && treeCount < 130; attempt++) {
    const x = (rand() - .5) * 96, z = (rand() - .5) * 92
    if (Math.hypot(x, z) > 49 || z > shoreline(x) - 6 || Math.abs(x - riverX(z)) < 4 || distanceToTrail(x, z) < 3.1) continue
    if (districts.some((district) => Math.hypot(x - district.center[0], z - district.center[1]) < 9 || Math.hypot(x - district.entrance[0], z - district.entrance[1]) < 6)) continue
    if (x > -3 && x < 12 && z > 11 && z < 28) continue
    const size = .65 + rand() * .65
    tree(kit, x, z, size, snowAt(x, z) > .45)
    groveRoots.push({ x, z })
    colliders.push({ kind: 'circle', x, z, r: .33 * size }); treeCount++
  }
  // Deliberately placed foreground/background acacias frame the opening.
  for (const [x, z, size] of [[-11, 2, .92], [10, 1, 1.1], [-4, -4, 1], [8, 18, .62], [-32, -4, 1.2]]) {
    tree(kit, x, z, size); colliders.push({ kind: 'circle', x, z, r: .35 * size })
    groveRoots.push({ x, z })
  }
  for (let i = 0; i < 70; i++) {
    const x = (rand() - .5) * 90, z = (rand() - .5) * 85
    if (distanceToTrail(x, z) < 2.5 || z > shoreline(x) - 3 || Math.abs(x - riverX(z)) < 3.2 || districts.some((district) => Math.hypot(x - district.center[0], z - district.center[1]) < 8)) continue
    const size = .25 + rand() * .45
    kit.add(rockGeometry, 0xa9b1a6, [x, heightAt(x, z) + size * .3, z], [size, size * .65, size * .8], [0, rand() * 6, 0], 'plain', true)
    if (size > .5) colliders.push({ kind: 'circle', x, z, r: size * .7 })
  }
  rockGeometry.dispose()
  for (const [x, z] of [[-5, 7], [5, 7], [19, 5], [-22, 12], [13, 28]]) {
    const y = heightAt(x, z)
    kit.box(x, y + 1.35, z, .09, 2.7, .09, 0x4d6454)
    kit.box(x, y + 2.75, z, .32, .42, .32, 0xd8c58e)
    kit.cylinder(x, y + 3.02, z, .0, .28, .24, 0x556957, 4)
  }
  // Cargo, benches and café furniture make the waterfront inhabited.
  for (let i = 0; i < 4; i++) {
    const x = 8 + i * 3.5, z = 27.7, y = heightAt(x, z)
    kit.cylinder(x, y + .8, z, .65, .65, .07, 0x839b70, 12)
    kit.cylinder(x, y + .4, z, .055, .08, .8, 0x506853)
    for (const side of [-1, 1]) { kit.box(x + side * .9, y + .45, z, .42, .08, .42, 0x748a63); kit.box(x + side * 1.05, y + .75, z, .07, .5, .44, 0x748a63) }
  }
  resident(kit, 10, 29, 0x5e8190); resident(kit, 18, 29, 0xb89d66); resident(kit, -23, 10, 0x80936c)
  kit.commit(group)

  // Instanced living grass: one draw call, with height-biome-aware placement.
  const blades = new THREE.BufferGeometry()
  blades.setAttribute('position', new THREE.Float32BufferAttribute([-.025, 0, 0, .025, 0, 0, .075, .3, 0, 0, 0, -.025, 0, 0, .025, 0, .26, .07], 3))
  blades.setAttribute('uv', new THREE.Float32BufferAttribute([0,0,1,0,.5,1,0,0,1,0,.5,1], 2)); blades.computeVertexNormals()
  const grassMaterial = new THREE.MeshToonMaterial({ color: 0x698b4f, gradientMap: kit.gradient, side: THREE.DoubleSide })
  grassMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.time = waterTime
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float time;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.x += sin(time * 1.1 + instanceMatrix[3][0] * .5 + instanceMatrix[3][2] * .6) * position.y * .25;')
  }
  const grass = new THREE.InstancedMesh(blades, grassMaterial, 6500), dummy = new THREE.Object3D()
  let placed = 0
  for (let i = 0; i < 9500 && placed < 6500; i++) {
    let x: number, z: number
    const cluster = rand()
    if (cluster < .52 && groveRoots.length) {
      const root = groveRoots[Math.floor(rand() * groveRoots.length)], a = rand() * Math.PI * 2, r = .45 + rand() * 2.8
      x = root.x + Math.cos(a) * r; z = root.z + Math.sin(a) * r
    } else if (cluster < .74) {
      z = -28 + rand() * 59; x = riverX(z) + (rand() > .5 ? 1 : -1) * (2.9 + rand() * 1.5)
    } else { x = (rand() - .5) * 104; z = (rand() - .5) * 98 }
    if (z > shoreline(x) - 3 || Math.hypot(x, z) > 52 || distanceToTrail(x, z) < 1.65 || Math.abs(x - riverX(z)) < 2.8 || snowAt(x, z) > .4) continue
    if (districts.some((district) => Math.hypot(x - district.center[0], z - district.center[1]) < 5.5)) continue
    dummy.position.set(x, heightAt(x, z), z); dummy.rotation.y = rand() * Math.PI; dummy.scale.setScalar(.6 + rand() * .6); dummy.updateMatrix(); grass.setMatrixAt(placed++, dummy.matrix)
  }
  grass.count = placed; group.add(grass)
  const flowers = new THREE.InstancedMesh(new THREE.PlaneGeometry(.22, .22).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: 0xffffff, map: kit.textures.flower, alphaTest: .3, gradientMap: kit.gradient, side: THREE.DoubleSide }), 600)
  const flowerBeds = [[-4, 9], [7, 8], [-33, 7], [-22.7, 7.8], [18.1, -1.8], [2, 15], [4, 28], [17, 30]]
  const flowerColors = [new THREE.Color(0xecdcb0), new THREE.Color(0xd5a89d), new THREE.Color(0xa1c4b4)]
  for (let i = 0; i < 600; i++) {
    const a = i * 2.4, anchor = flowerBeds[i % flowerBeds.length], r = rand() * 1.3
    const x = anchor[0] + Math.sin(a) * r, z = anchor[1] + Math.cos(a) * r
    dummy.position.set(x, heightAt(x, z) + .12, z); dummy.scale.setScalar(.8 + rand() * .5); dummy.updateMatrix(); flowers.setMatrixAt(i, dummy.matrix)
    flowers.setColorAt(i, flowerColors[i % flowerColors.length])
  }
  group.add(flowers)

  const kijazo = makeKijazo(kit.gradient); kijazo.position.set(.5, heightAt(.5, 10.5) + .25, 10.5); group.add(kijazo)
  kijazo.remove(kijazo.userData.tipGlow)
  const antenna = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 6), new THREE.MeshBasicMaterial({ color: 0xecc36b }))
  antenna.position.set(0, 1.6, 0); kijazo.add(antenna)
  const guide: WorldTarget = { id: 'kijazo', kind: 'guide', title: 'Talk to Kijazo', x: 3, y: kijazo.position.y, z: 12, radius: 3.1 }; targets.push(guide)
  const guideDestination = new THREE.Vector3()
  const guideOffset = new THREE.Vector3(-1.6, .4, -1.2)
  const smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.24, 1), new THREE.MeshBasicMaterial({ color: 0xb7c2b8, transparent: true, opacity: .22, depthWrite: false }), 12)
  group.add(smoke)
  const smokeOrigins = [new THREE.Vector3(-1.8, heightAt(0, 5) + 6, 4.3), new THREE.Vector3(21.2, heightAt(23, -30) + 6, -30.7)]
  const life = buildLivingGarden(group, kit.gradient)
  return {
    group, terrain, colliders, targets, plants, kijazo, gradient: kit.gradient,
    statistics: { notes: plants.length, trees: treeCount + 5, grass: placed, flowers: 600, ...life.counts },
    update(time, night, player, animate, dt, environment = { weather: 'clear', light: 'day' }) {
      const t = animate ? time : 0
      const profile = environmentProfile(environment)
      waterTime.value = t; water.uniforms.night.value = night; water.uniforms.wind.value = profile.wind; water.uniforms.golden.value = profile.golden
      kit.update(t, night, profile.wind); boatKit.update(t, night, profile.wind)
      mooredBoat.position.y = Math.sin(t * .95) * .04; mooredBoat.rotation.z = Math.sin(t * .65) * .025; mooredBoat.rotation.x = Math.cos(t * .7) * .014
      life.update(t, night, player, animate, dt, environment)
      fireGroups.forEach((fire, i) => { fire.scale.y = 1 + Math.sin(t * 7 + i) * .14 })
      if (player.distanceTo(kijazo.position) > 2.8) {
        guideDestination.copy(player).add(guideOffset)
        kijazo.position.lerp(guideDestination, 1 - Math.exp(-dt * 3.2))
      }
      kijazo.position.y = Math.max(.5, heightAt(kijazo.position.x, kijazo.position.z)) + .25 + Math.sin(t * 1.9) * .08
      kijazo.lookAt(player.x, kijazo.position.y, player.z)
      guide.x = kijazo.position.x; guide.z = kijazo.position.z; guide.y = kijazo.position.y
      for (let i = 0; i < 12; i++) {
        const p = (t * .11 + i % 6 / 6) % 1, origin = smokeOrigins[Math.floor(i / 6)]
        dummy.position.copy(origin); dummy.position.x += p * 1.7; dummy.position.y += p * 2.5
        dummy.rotation.set(0, p * 2, p * .6); dummy.scale.setScalar(.25 + p * 1.9); dummy.updateMatrix(); smoke.setMatrixAt(i, dummy.matrix)
      }
      smoke.instanceMatrix.needsUpdate = true
    },
    dispose() { kit.disposeTextures(); boatKit.disposeTextures(); boatKit.gradient.dispose(); water.dispose() },
  }
}
