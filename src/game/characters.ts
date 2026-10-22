import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { P } from './palette'

export type CharacterParts = {
  armL: THREE.Group
  armR: THREE.Group
  legL: THREE.Group
  legR: THREE.Group
}

const materials = new WeakMap<THREE.DataTexture, Map<number, THREE.MeshToonMaterial>>()
const outlineMaterials = new WeakMap<THREE.DataTexture, THREE.MeshBasicMaterial>()
function toon(color: number, gradient: THREE.DataTexture) {
  const palette = materials.get(gradient) ?? new Map<number, THREE.MeshToonMaterial>()
  materials.set(gradient, palette)
  if (!palette.has(color)) palette.set(color, new THREE.MeshToonMaterial({ color, gradientMap: gradient }))
  return palette.get(color)!
}

function outlined(group: THREE.Group, geometry: THREE.BufferGeometry, color: number, gradient: THREE.DataTexture, position: [number, number, number]) {
  const mesh = new THREE.Mesh(geometry, toon(color, gradient))
  mesh.position.set(...position)
  mesh.castShadow = true
  if (!outlineMaterials.has(gradient)) outlineMaterials.set(gradient, new THREE.MeshBasicMaterial({ color: P.ink, side: THREE.BackSide }))
  const outline = new THREE.Mesh(geometry, outlineMaterials.get(gradient)!)
  outline.scale.setScalar(1.035)
  mesh.add(outline)
  group.add(mesh)
  return mesh
}

/** Merge static details inside each articulated part, retaining native geometry. */
function batchPart(group: THREE.Group) {
  group.updateMatrixWorld(true)
  const inverse = group.matrixWorld.clone().invert()
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>()
  const original = new Set<THREE.BufferGeometry>()
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld))
    const list = batches.get(object.material) ?? []; list.push(geometry); batches.set(object.material, list); original.add(object.geometry)
  })
  group.clear()
  for (const [material, geometry] of batches) {
    const mesh = new THREE.Mesh(mergeGeometries(geometry, false)!, material)
    mesh.castShadow = material instanceof THREE.MeshToonMaterial; mesh.receiveShadow = true; group.add(mesh)
    geometry.forEach((entry) => entry.dispose())
  }
  original.forEach((geometry) => geometry.dispose())
}

export function makeMessenger(gradient: THREE.DataTexture) {
  const character = new THREE.Group()
  const skin = 0xb18760, jacket = 0xc58552, ink = 0x263c3b, cloth = 0xe9dab7, leather = 0x6f5840
  const torso = new THREE.Group()
  const jacketShape = new THREE.Shape()
  jacketShape.moveTo(-.23, -.3); jacketShape.lineTo(-.28, .13); jacketShape.lineTo(-.32, .32); jacketShape.lineTo(-.19, .42); jacketShape.lineTo(.19, .42); jacketShape.lineTo(.32, .32); jacketShape.lineTo(.28, .13); jacketShape.lineTo(.23, -.3); jacketShape.closePath()
  const jacketGeometry = new THREE.ExtrudeGeometry(jacketShape, { depth: .34, bevelEnabled: true, bevelSize: .025, bevelThickness: .02, bevelSegments: 2, steps: 1 })
  jacketGeometry.translate(0, 0, -.17)
  outlined(torso, jacketGeometry, jacket, gradient, [0, 1.08, 0])
  outlined(torso, new THREE.CylinderGeometry(.11, .12, .18, 10), skin, gradient, [0, 1.53, 0])
  outlined(torso, new THREE.BoxGeometry(.21, .22, .045), cloth, gradient, [0, 1.35, .205])
  outlined(torso, new THREE.BoxGeometry(.038, .57, .035), 0x825c3d, gradient, [0, 1.07, .207])
  for (const x of [-.16, .16]) outlined(torso, new THREE.BoxGeometry(.16, .13, .035), 0xb67547, gradient, [x, .99, .209])
  for (const y of [.9, 1.12, 1.31]) outlined(torso, new THREE.SphereGeometry(.022, 6, 4), cloth, gradient, [.045, y, .231])
  const strap = outlined(torso, new THREE.BoxGeometry(.065, .72, .048), cloth, gradient, [0, 1.13, .239]); strap.rotation.z = -.49
  character.add(torso)

  const head = new THREE.Group(); head.position.set(0, 1.79, 0)
  const face = outlined(head, new THREE.SphereGeometry(.29, 16, 12), skin, gradient, [0, 0, 0]); face.scale.set(.92, 1.02, .91)
  for (const side of [-1, 1]) outlined(head, new THREE.SphereGeometry(.065, 8, 6), skin, gradient, [side * .26, -.005, 0])
  const hair = outlined(head, new THREE.SphereGeometry(.296, 14, 8, 0, Math.PI * 2, 0, Math.PI * .43), 0x33433b, gradient, [0, .064, -.018]); hair.scale.set(1, .9, 1)
  outlined(head, new THREE.BoxGeometry(.39, .25, .09), 0x33433b, gradient, [0, .04, -.23])
  for (let i = 0; i < 7; i++) {
    const angle = i * .8 - .7
    outlined(head, new THREE.SphereGeometry(.064, 7, 5), i % 2 ? 0x3c4b40 : 0x2a3c35, gradient, [Math.sin(angle) * .23, .19 + Math.cos(angle) * .04, Math.cos(angle) * .17])
  }
  for (const side of [-1, 1]) {
    outlined(head, new THREE.SphereGeometry(.029, 7, 5), ink, gradient, [side * .096, .019, .26])
    const brow = outlined(head, new THREE.BoxGeometry(.083, .021, .025), ink, gradient, [side * .099, .095, .252]); brow.rotation.z = side * -.1
    outlined(head, new THREE.SphereGeometry(.011, 5, 4), cloth, gradient, [side * .096 + .006, .027, .279])
  }
  const nose = outlined(head, new THREE.SphereGeometry(.046, 8, 6), 0x986947, gradient, [0, -.031, .268]); nose.scale.set(.7, .85, 1)
  outlined(head, new THREE.BoxGeometry(.085, .019, .025), 0x704c39, gradient, [0, -.114, .245])
  character.add(head)

  const bag = new THREE.Group(); bag.position.set(.29, 1.04, -.2)
  const satchel = outlined(bag, new THREE.BoxGeometry(.4, .43, .22), leather, gradient, [0, -.12, 0]); satchel.rotation.z = -.07
  outlined(bag, new THREE.BoxGeometry(.44, .15, .25), 0xaa8156, gradient, [0, .06, .005])
  outlined(bag, new THREE.BoxGeometry(.045, .24, .028), cloth, gradient, [0, -.06, -.126])
  outlined(bag, new THREE.BoxGeometry(.083, .075, .035), 0xd5bc7a, gradient, [0, -.11, -.145])
  outlined(bag, new THREE.BoxGeometry(.15, .27, .025), 0xf1e3c1, gradient, [-.1, .2, -.04]).rotation.z = -.15
  character.add(bag)
  const scarf = new THREE.Group(); scarf.position.set(0, 1.47, .03)
  const collar = outlined(scarf, new THREE.TorusGeometry(.15, .047, 6, 14), 0x365f58, gradient, [0, 0, 0]); collar.rotation.x = Math.PI / 2
  const tail = outlined(scarf, new THREE.BoxGeometry(.12, .39, .035), 0x365f58, gradient, [.13, -.19, .18]); tail.rotation.z = .16
  character.add(scarf)

  const limb = (x: number, arm: boolean) => {
    const pivot = new THREE.Group(); pivot.position.set(x, arm ? 1.37 : .77, 0)
    outlined(pivot, new THREE.CapsuleGeometry(arm ? .075 : .091, arm ? .36 : .46, 4, 9), arm ? jacket : 0x3b5960, gradient, [0, arm ? -.24 : -.29, 0])
    if (arm) {
      outlined(pivot, new THREE.CylinderGeometry(.078, .077, .085, 9), 0xe0c59e, gradient, [0, -.45, 0])
      outlined(pivot, new THREE.SphereGeometry(.079, 8, 6), skin, gradient, [0, -.53, 0])
    } else {
      outlined(pivot, new THREE.BoxGeometry(.19, .17, .32), 0x514b3a, gradient, [0, -.66, .045])
      outlined(pivot, new THREE.BoxGeometry(.2, .04, .33), 0xb0a07b, gradient, [0, -.735, .045])
    }
    character.add(pivot); return pivot
  }
  const parts: CharacterParts = { armL: limb(-.335, true), armR: limb(.335, true), legL: limb(-.13, false), legR: limb(.13, false) }
  character.userData.parts = parts; character.userData.details = { torso, head, bag, scarf }
  for (const part of [torso, head, bag, scarf, ...Object.values(parts)]) batchPart(part)
  character.scale.setScalar(.95)
  return character
}

export function makeKijazo(gradient: THREE.DataTexture) {
  const kijazo = new THREE.Group()

  const body = outlined(kijazo, new THREE.CapsuleGeometry(0.21, 0.34, 5, 10), 0x91a28b, gradient, [0, 0.52, 0])
  const face = outlined(kijazo, new THREE.SphereGeometry(0.24, 16, 12), 0x203d47, gradient, [0, 1.06, 0])
  face.scale.set(1.12, .95, 1)
  for (const x of [-0.08, 0.08]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd56d }))
    eye.position.set(x, 1.09, .255)
    kijazo.add(eye)
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 12, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffd56d }))
  mouth.rotation.z = Math.PI
  mouth.position.set(0, 1.0, .252)
  kijazo.add(mouth)

  const antenna = outlined(kijazo, new THREE.CylinderGeometry(0.015, 0.015, 0.3, 5), 0x6b5138, gradient, [0, 1.42, 0])
  const tipGlow = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffd56d, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }))
  tipGlow.scale.set(0.4, 0.4, 1)
  tipGlow.position.set(0, 1.6, 0)
  kijazo.add(tipGlow)
  kijazo.userData.tipGlow = tipGlow

  const panel = outlined(kijazo, new THREE.BoxGeometry(0.4, 0.26, 0.05), 0x31516d, gradient, [-0.2, 0.55, 0.18])
  panel.rotation.z = 0.3
  const scarf = outlined(kijazo, new THREE.TorusGeometry(0.17, 0.045, 6, 14), 0xb35a3a, gradient, [0, 0.86, 0])
  scarf.rotation.x = Math.PI / 2

  kijazo.scale.setScalar(0.9)
  void body
  return kijazo
}
