import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { createGardenTextures } from './textures'

export const INK = 0x253b36
export function seeded(seed: number) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 } }
type Surface = 'plain' | 'wood' | 'stone' | 'leaf' | 'snow' | 'glass' | 'paving' | 'earth' | 'roof' | 'window'

/** An authored modular mesh kit, batched by material once at startup. */
export class NativeKit {
  readonly gradient = new THREE.DataTexture(new Uint8Array([122, 147, 171, 193, 213, 231, 245, 255]), 8, 1, THREE.RedFormat)
  readonly textures = createGardenTextures()
  private materials = new Map<string, THREE.MeshToonMaterial>()
  private pieces = new Map<string, { material: THREE.Material; geometries: THREE.BufferGeometry[] }>()
  private lines: number[] = []
  private cube = new THREE.BoxGeometry(1, 1, 1)
  private sphere = new THREE.SphereGeometry(1, 10, 8)
  private matrix = new THREE.Matrix4()
  private transform = new THREE.Object3D()

  constructor() {
    this.gradient.needsUpdate = true
    this.gradient.minFilter = this.gradient.magFilter = THREE.NearestFilter
    const vertices = this.sphere.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i)
      const noise = 1 + Math.sin(x * 8 + z * 7) * Math.cos(y * 10 - x * 5) * 0.065
      vertices.setXYZ(i, x * noise, y * noise, z * noise)
    }
    this.sphere.computeVertexNormals()
  }

  material(color: number, surface: Surface = 'plain') {
    const key = `${color}:${surface}`
    if (this.materials.has(key)) return this.materials.get(key)!
    const material = new THREE.MeshToonMaterial({ color, gradientMap: this.gradient })
    material.userData.surface = surface
    if (surface === 'window') { material.emissive.set(0xfacb83); material.emissiveIntensity = .02 }
    if (surface === 'glass') {
      material.transparent = true; material.opacity = .075; material.depthWrite = false; material.side = THREE.FrontSide
      material.emissive.set(0x738d85); material.emissiveIntensity = .16
    }
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uGardenTime = { value: 0 }
      shader.uniforms.uGardenWind = { value: .65 }
      shader.uniforms.uGardenTexture = { value: this.textures[surface] ?? this.textures.plain }
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGarden; varying vec3 vGardenNormal; uniform float uGardenTime; uniform float uGardenWind;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          ${surface === 'leaf' ? 'transformed.x += sin(uGardenTime * .8 + position.x * .27 + position.z * .21) * .06*uGardenWind;' : ''}`)
        .replace('#include <project_vertex>', '#include <project_vertex>\nvGarden = (modelMatrix * vec4(transformed,1.)).xyz; vGardenNormal=normalize(mat3(modelMatrix)*normal);')
      const pigment = surface === 'wood' ? `float mark = step(.965, fract(vGarden.y * 3.8)); diffuseColor.rgb *= 1. - mark * .32;`
        : surface === 'stone' ? `float course = step(.965, fract(vGarden.y * 2.2)); float joint = step(.974, fract(vGarden.x * 1.7 + floor(vGarden.y * 2.2) * .5 + vGarden.z * 1.7)); diffuseColor.rgb *= 1. - max(course, joint) * .18;`
          : surface === 'leaf' ? `float fleck = fract(sin(dot(floor(vGarden.xz * 15. + vGarden.y * 11.), vec2(12.3,43.7))) * 7218.3); diffuseColor.rgb *= .93 + step(.82,fleck) * .13;`
            : surface === 'paving' ? `float row = floor(vGarden.z * 2.8); float seam = max(step(.92,fract(vGarden.z * 2.8)), step(.93,fract(vGarden.x * 2.2 + mod(row,2.) * .5))); diffuseColor.rgb *= 1. - seam * .27;` : ''
      const scale = surface === 'earth' ? .65 : surface === 'leaf' ? .8 : surface === 'wood' ? .45 : .55
      const painted = surface === 'glass' || surface === 'window' ? '' : `vec3 weights=pow(abs(normalize(vGardenNormal)),vec3(5.));weights/=max(.001,weights.x+weights.y+weights.z);
        vec3 surfacePaint=texture2D(uGardenTexture,vGarden.yz*${scale}).rgb*weights.x+texture2D(uGardenTexture,vGarden.xz*${scale}).rgb*weights.y+texture2D(uGardenTexture,vGarden.xy*${scale}).rgb*weights.z;
        diffuseColor.rgb*=mix(vec3(1.),surfacePaint,.68);`
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGarden; varying vec3 vGardenNormal; uniform sampler2D uGardenTexture;')
        .replace('#include <map_fragment>', `#include <map_fragment>\n${painted}\n${pigment}`)
      material.userData.shader = shader
    }
    material.customProgramCacheKey = () => `garden-${surface}`
    this.materials.set(key, material)
    return material
  }

  add(geometry: THREE.BufferGeometry, color: number, p: [number, number, number], scale: [number, number, number] = [1, 1, 1], rotation: [number, number, number] = [0, 0, 0], surface: Surface = 'plain', edge = false) {
    this.transform.position.set(...p); this.transform.scale.set(...scale); this.transform.rotation.set(...rotation); this.transform.updateMatrix()
    this.matrix.copy(this.transform.matrix)
    const baked = geometry.index ? geometry.toNonIndexed() : geometry.clone()
    baked.applyMatrix4(this.matrix)
    const mat = this.material(color, surface)
    // Spatial material batches are independently frustum-culled. The entire
    // island remains loaded and connected; unseen trees do not cost a full draw.
    const key = `${mat.uuid}:${Math.floor(p[0] / 24)}:${Math.floor(p[2] / 24)}`
    const batch = this.pieces.get(key) ?? { material: mat, geometries: [] }
    batch.geometries.push(baked); this.pieces.set(key, batch)
    if (edge) {
      const edges = new THREE.EdgesGeometry(geometry, 35)
      edges.applyMatrix4(this.matrix)
      const positions = edges.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < positions.count; i++) this.lines.push(positions.getX(i), positions.getY(i), positions.getZ(i))
      edges.dispose()
    }
  }

  box(x: number, y: number, z: number, w: number, h: number, d: number, color: number, surface: Surface = 'plain', rotation: [number, number, number] = [0, 0, 0]) {
    this.add(this.cube, color, [x, y, z], [w, h, d], rotation, surface, true)
  }
  ball(x: number, y: number, z: number, sx: number, sy: number, sz: number, color: number, surface: Surface = 'leaf') {
    this.add(this.sphere, color, [x, y, z], [sx, sy, sz], [0, x * .07, 0], surface)
  }
  cylinder(x: number, y: number, z: number, top: number, bottom: number, h: number, color: number, sides = 10) {
    const geometry = new THREE.CylinderGeometry(top, bottom, h, sides)
    this.add(geometry, color, [x, y, z], [1, 1, 1], [0, 0, 0], 'plain', true); geometry.dispose()
  }
  branch(from: THREE.Vector3, to: THREE.Vector3, radius: number, color = 0x84644f) {
    const delta = to.clone().sub(from)
    const object = new THREE.Object3D()
    object.position.copy(from).add(to).multiplyScalar(.5)
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize())
    const rotation = new THREE.Euler().setFromQuaternion(object.quaternion)
    const geometry = new THREE.CylinderGeometry(radius * .55, radius, delta.length(), 7)
    this.add(geometry, color, object.position.toArray() as [number, number, number], [1, 1, 1], [rotation.x, rotation.y, rotation.z], 'wood', true)
    geometry.dispose()
  }
  line(points: THREE.Vector3[]) {
    for (let i = 1; i < points.length; i++) this.lines.push(...points[i - 1].toArray(), ...points[i].toArray())
  }

  commit(parent: THREE.Group) {
    for (const { material, geometries } of this.pieces.values()) {
      const merged = mergeGeometries(geometries, false)!
      const mesh = new THREE.Mesh(merged, material)
      mesh.castShadow = !material.transparent; mesh.receiveShadow = !material.transparent
      parent.add(mesh)
      geometries.forEach((geometry) => geometry.dispose())
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.lines, 3))
    parent.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .64 })))
    this.pieces.clear(); this.lines = []
    this.cube.dispose(); this.sphere.dispose()
  }
  update(time: number, night = 0, wind = .65) {
    this.materials.forEach((material) => {
      if (material.userData.shader) { material.userData.shader.uniforms.uGardenTime.value = time; material.userData.shader.uniforms.uGardenWind.value = wind }
      if (material.userData.surface === 'window') material.emissiveIntensity = .02 + night * .9
    })
  }
  disposeTextures() { Object.values(this.textures).forEach(texture => texture.dispose()) }
}
