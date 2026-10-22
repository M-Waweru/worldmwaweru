import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { heightAt, riverX, shoreline, snowAt } from './engine/terrain'
import { seeded } from './native/kit'
import { environmentProfile, type GardenEnvironment } from './environment'

/** Ambient inhabitants do not alter routes, colliders, note IDs, or reading behavior. */
export function buildLivingGarden(parent: THREE.Group, gradient: THREE.DataTexture) {
  const group = new THREE.Group(); parent.add(group)
  const random = seeded(19062), dummy = new THREE.Object3D(), timeUniform = { value: 0 }
  const material = (color: number, extra: THREE.MeshToonMaterialParameters = {}) => new THREE.MeshToonMaterial({ color, gradientMap: gradient, ...extra })
  type Inhabitant = { x: number; y: number; z: number; phase: number; size: number; radius: number }
  function instanced(geometry: THREE.BufferGeometry, mat: THREE.Material, count: number) {
    const mesh = new THREE.InstancedMesh(geometry, mat, count)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; group.add(mesh); return mesh
  }
  const fishData: Inhabitant[] = []
  for (let i = 0; i < 42; i++) {
    const z = -25 + i * 1.42, x = riverX(z) + (random() - .5) * 1.9
    fishData.push({ x, y: .27, z, phase: random() * 6.28, size: .14 + random() * .1, radius: .25 + random() * .35 })
  }
  for (let i = 0; i < 45; i++) {
    const x = -20 + random() * 62, z = shoreline(x) + 1.5 + random() * 15
    fishData.push({ x, y: -.05 - random() * .15, z, phase: random() * 6.28, size: .17 + random() * .13, radius: .5 + random() * 1.5 })
  }
  const fishGeometry = mergeGeometries([
    new THREE.SphereGeometry(1, 7, 5).scale(1.25, .32, .45).toNonIndexed(),
    new THREE.ConeGeometry(.5, .7, 3).rotateZ(Math.PI / 2).translate(-1.38, 0, 0).toNonIndexed(),
  ])!
  const fish = instanced(fishGeometry, material(0x546f66), fishData.length)
  fishData.forEach((_, i) => fish.setColorAt(i, new THREE.Color([0xb1b39b, 0x89a6a0, 0xa88f75, 0x829d83][i % 4])))

  const birdGeometry = new THREE.BufferGeometry()
  birdGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-.06,0,-.18,.06,0,-.18,0,0,.32,-.05,0,0,-.65,.06,-.12,-.42,0,.19,.05,0,0,.65,.06,-.12,.42,0,.19], 3)); birdGeometry.computeVertexNormals()
  const birdMaterial = material(0xf3edd8, { side: THREE.DoubleSide })
  birdMaterial.onBeforeCompile = shader => {
    shader.uniforms.uLifeTime = timeUniform
    shader.vertexShader = `uniform float uLifeTime;\n${shader.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y+=sin(uLifeTime*5.+instanceMatrix[3].x)*abs(position.x)*.24;')
  }
  const birdData = Array.from({ length: 20 }, (_, i) => ({ x: [-8, 16, -25, 23][i % 4], y: 7 + random() * 6, z: [8, 29, -18, -30][i % 4], phase: random() * 6.28, size: .5 + random() * .4, radius: 5 + random() * 12 }))
  const birds = instanced(birdGeometry, birdMaterial, birdData.length)
  const wingGeometry = new THREE.BufferGeometry()
  wingGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0,-.18,.01,-.12,-.19,.02,.14,0,0,0,.18,.01,-.12,.19,.02,.14], 3)); wingGeometry.computeVertexNormals()
  const butterflyData = Array.from({ length: 32 }, (_, i) => ({ x: [3, -23, 20, -15][i % 4] + (random() - .5) * 9, y: 0, z: [12, 8, 0, -19][i % 4] + (random() - .5) * 9, phase: random() * 6.28, size: .65 + random() * .55, radius: .5 + random() * 1.5 }))
  const butterflies = instanced(wingGeometry, material(0xffffff, { side: THREE.DoubleSide }), butterflyData.length)
  butterflyData.forEach((_, i) => butterflies.setColorAt(i, new THREE.Color([0xd1a564, 0x9cbfbe, 0xd6ba96, 0xe5d6a5][i % 4])))

  const beeGeometry = new THREE.SphereGeometry(.06, 6, 4).scale(1.3, .8, .8)
  const bees = instanced(beeGeometry, material(0xbaa453), 16)
  const beeAnchors = [[-4, 9], [7, 8], [-23, 8], [18, -2]]

  const reeds = new THREE.InstancedMesh(new THREE.PlaneGeometry(.08, .8, 1, 3).translate(0, .4, 0), material(0x779552, { side: THREE.DoubleSide }), 220)
  let reedCount = 0
  for (let i = 0; i < 350 && reedCount < 220; i++) {
    const z = -29 + random() * 59, x = riverX(z) + (random() > .5 ? 1 : -1) * (2.3 + random() * .5)
    if (heightAt(x, z) < .45 || snowAt(x, z) > .3) continue
    dummy.position.set(x, heightAt(x, z), z); dummy.rotation.set(0, random() * Math.PI, (random() - .5) * .2); dummy.scale.setScalar(.55 + random() * .7); dummy.updateMatrix(); reeds.setMatrixAt(reedCount++, dummy.matrix)
  }
  reeds.count = reedCount; group.add(reeds)

  const fireData: Inhabitant[] = []
  for (let i = 0; i < 100; i++) { const x = -36 + random() * 70, z = -21 + random() * 52; if (heightAt(x, z) > .5) fireData.push({ x, y: heightAt(x, z) + .8 + random(), z, phase: random() * 6, size: 1, radius: .6 }) }
  const firePositions = new Float32Array(fireData.length * 3), fireGeometry = new THREE.BufferGeometry()
  fireGeometry.setAttribute('position', new THREE.BufferAttribute(firePositions, 3))
  const fireflies = new THREE.Points(fireGeometry, new THREE.PointsMaterial({ color: 0xe9d493, size: .075, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); group.add(fireflies)

  const leafData = Array.from({ length: 34 }, () => ({ x: -30 + random() * 63, z: -25 + random() * 58, phase: random() * 6, size: .065 + random() * .07 }))
  const leaves = instanced(new THREE.PlaneGeometry(.65, 1).rotateX(-Math.PI / 2), material(0xa89558, { side: THREE.DoubleSide }), leafData.length)
  const rainPositions = new Float32Array(800 * 3)
  for (let i = 0; i < 800; i++) { rainPositions[i * 3] = (random() - .5) * 48; rainPositions[i * 3 + 1] = random() * 23; rainPositions[i * 3 + 2] = (random() - .5) * 48 }
  const rainGeometry = new THREE.BufferGeometry(); rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3))
  const rain = new THREE.Points(rainGeometry, new THREE.PointsMaterial({ color: 0xcbd8d6, size: .05, transparent: true, opacity: .65, depthWrite: false })); rain.visible = false; group.add(rain)

  const clouds: THREE.Mesh[] = [], cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xe5ece0, transparent: true, opacity: .27, depthWrite: false })
  for (let i = 0; i < 6; i++) {
    const puffs = []
    for (let j = 0; j < 4; j++) { const geometry = new THREE.IcosahedronGeometry(1, 1); geometry.scale(2.5 + random(), .6 + random() * .4, 1.7); geometry.translate(j * 1.8 - 3, random() * .35, random() * .6); puffs.push(geometry) }
    const cloud = new THREE.Mesh(mergeGeometries(puffs)!, cloudMaterial); cloud.position.set(-45 + i * 16, 14 + random() * 8, -42 + random() * 68); group.add(cloud); clouds.push(cloud)
  }

  return {
    counts: { fish: fishData.length, birds: birdData.length, butterflies: butterflyData.length, bees: 16, fireflies: fireData.length, reeds: reedCount },
    update(time: number, night: number, player: THREE.Vector3, animate: boolean, dt: number, environment: GardenEnvironment) {
      const t = animate ? time : 0, profile = environmentProfile(environment)
      timeUniform.value = t
      fishData.forEach((p, i) => {
        const river = i < 42, angle = t * .35 + p.phase
        dummy.position.set(p.x + Math.sin(angle) * p.radius * (river ? .45 : 1), p.y + Math.sin(t + p.phase) * .015, p.z + Math.cos(angle) * p.radius)
        dummy.rotation.set(0, -angle, Math.sin(t * 5 + p.phase) * .03); dummy.scale.setScalar(p.size); dummy.updateMatrix(); fish.setMatrixAt(i, dummy.matrix)
      }); fish.instanceMatrix.needsUpdate = true
      birdData.forEach((p, i) => { const angle = t * (.12 + i % 4 * .02) + p.phase; dummy.position.set(p.x + Math.cos(angle) * p.radius, p.y + Math.sin(angle) * .6, p.z + Math.sin(angle) * p.radius * .75); dummy.rotation.set(.05, -angle, Math.sin(angle) * .13); dummy.scale.setScalar(p.size); dummy.updateMatrix(); birds.setMatrixAt(i, dummy.matrix) }); birds.instanceMatrix.needsUpdate = true
      butterflyData.forEach((p, i) => { const x = p.x + Math.sin(t * .45 + p.phase) * p.radius, z = p.z + Math.cos(t * .4 + p.phase) * p.radius; dummy.position.set(x, heightAt(x, z) + .7 + Math.sin(t * .8 + p.phase) * .2, z); dummy.rotation.set(Math.sin(t * 12 + p.phase) * .7, p.phase + t * .3, 0); dummy.scale.setScalar(p.size); dummy.updateMatrix(); butterflies.setMatrixAt(i, dummy.matrix) }); butterflies.instanceMatrix.needsUpdate = true
      for (let i = 0; i < 16; i++) { const p = beeAnchors[i % 4]; dummy.position.set(p[0] + Math.sin(t * 1.1 + i) * .7, heightAt(p[0], p[1]) + .4 + Math.cos(t * 2 + i) * .13, p[1] + Math.cos(t * .9 + i) * .7); dummy.rotation.set(0, t + i, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); bees.setMatrixAt(i, dummy.matrix) } bees.instanceMatrix.needsUpdate = true
      fireData.forEach((p, i) => { firePositions[i * 3] = p.x + Math.sin(t * .4 + p.phase) * .7; firePositions[i * 3 + 1] = p.y + Math.sin(t * .9 + p.phase) * .3; firePositions[i * 3 + 2] = p.z + Math.cos(t * .5 + p.phase) * .7 }); fireGeometry.attributes.position.needsUpdate = true; fireflies.material.opacity = night * .8
      leafData.forEach((p, i) => { const loop = (t * .12 * profile.wind + p.phase) % 1, x = p.x + loop * 3; dummy.position.set(x, heightAt(x, p.z) + (1 - loop) * 2, p.z + Math.sin(t + i) * .4); dummy.rotation.set(loop * 7, loop * 5, i); dummy.scale.setScalar(p.size); dummy.updateMatrix(); leaves.setMatrixAt(i, dummy.matrix) }); leaves.instanceMatrix.needsUpdate = true
      rain.visible = Boolean(profile.rain && animate); rain.position.set(player.x, 0, player.z)
      if (rain.visible) { for (let i = 0; i < 800; i++) { rainPositions[i * 3 + 1] -= dt * 13; if (rainPositions[i * 3 + 1] < heightAt(player.x, player.z)) rainPositions[i * 3 + 1] += 22 } rainGeometry.attributes.position.needsUpdate = true }
      if (animate) clouds.forEach((cloud, i) => { cloud.position.x += dt * (.17 + i * .025) * profile.wind; if (cloud.position.x > 58) cloud.position.x = -58 })
      cloudMaterial.color.set(night > .5 ? 0x617a82 : environment.weather === 'rain' ? 0xb0c0b8 : 0xe5ece0)
    },
  }
}
