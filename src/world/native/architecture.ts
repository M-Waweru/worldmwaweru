import * as THREE from 'three'
import { NativeKit, seeded } from './kit'
import { heightAt } from '../engine/terrain'
import { roofProfile } from './shapes'

export function roof(kit: NativeKit, x: number, y: number, z: number, width: number, depth: number, rise: number, color: number, snow = false) {
  const vertices: number[] = [], uvs: number[] = [], indices: number[] = []
  const nx = 20, nz = 8
  const elevation = (dx: number, dz: number) => roofProfile(dx, dz, width, rise)
  for (let iz = 0; iz <= nz; iz++) for (let ix = 0; ix <= nx; ix++) {
    const dx = (ix / nx - .5) * width, dz = (iz / nz - .5) * depth
    vertices.push(dx, elevation(dx, dz), dz); uvs.push(ix / nx, iz / nz)
    if (ix < nx && iz < nz) { const a = iz * (nx + 1) + ix; indices.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2) }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals()
  kit.add(geometry, color, [x, y, z], [1, 1, 1], [0, 0, 0], snow ? 'snow' : 'roof')
  geometry.dispose()
  for (const dz of [-depth / 2, depth / 2]) {
    const points = Array.from({ length: 31 }, (_, i) => { const dx = (i / 30 - .5) * width; return new THREE.Vector3(x + dx, y + elevation(dx, dz), z + dz) })
    kit.line(points)
  }
  if (!snow) for (let dz = -depth / 2; dz < depth / 2; dz += .52) {
    kit.line(Array.from({ length: 21 }, (_, i) => { const dx = (i / 20 - .5) * width; return new THREE.Vector3(x + dx, y + elevation(dx, dz) + .016, z + dz) }))
    for (let dx = -width / 2 + .4; dx < width / 2; dx += .8) {
      const offset = Math.round(dz * 2) % 2 * .22
      kit.line([new THREE.Vector3(x + dx + offset, y + elevation(dx + offset, dz) + .025, z + dz), new THREE.Vector3(x + dx + offset, y + elevation(dx + offset, dz + .44) + .025, z + dz + .44)])
    }
  }
}

function window(kit: NativeKit, x: number, y: number, z: number, width = 1, height = 1.3) {
  kit.box(x, y, z, width, height, .08, 0x557c80, 'window')
  for (const dx of [-width / 2, 0, width / 2]) kit.box(x + dx, y, z + .07, .07, height + .12, .1, 0x515d46)
  for (const dy of [-height / 2, .05, height / 2]) kit.box(x, y + dy, z + .07, width, .07, .1, 0x515d46)
  for (const side of [-1, 1]) kit.box(x + side * (width / 2 + .24), y, z + .07, .35, height + .1, .12, 0x788661, 'wood', [0, side * .16, 0])
  kit.box(x, y - height / 2 - .05, z + .09, width + .3, .12, .28, 0xb9af86)
}

export function homestead(kit: NativeKit, x: number, z: number, snow = false) {
  const y = heightAt(x, z)
  kit.box(x, y + .32, z, 7.1, .64, 5.4, 0xbebba6, 'stone')
  kit.box(x, y + 2.05, z, 6.6, 2.9, 4.8, 0xad8057, 'wood')
  for (const dx of [-3.25, 3.25]) kit.box(x + dx, y + 2.1, z + 2.45, .18, 3, .16, 0x765e45, 'wood')
  const gable = new THREE.Shape(); gable.moveTo(-3.3, 0); gable.lineTo(3.3, 0); gable.lineTo(0, 1.8); gable.closePath()
  const geometry = new THREE.ExtrudeGeometry(gable, { depth: 4.8, bevelEnabled: false })
  kit.add(geometry, 0x9b754f, [x, y + 3.45, z - 2.4], [1, 1, 1], [0, 0, 0], 'wood'); geometry.dispose()
  roof(kit, x, y + 3.48, z, 7.7, 5.9, 1.8, snow ? 0xf0f1f2 : 0x9b9080, snow)
  kit.box(x, y + 1.8, z + 2.44, 1.13, 2.2, .16, 0x68553d, 'wood')
  kit.cylinder(x + .35, y + 1.76, z + 2.57, .055, .055, .08, 0xcbbb84)
  window(kit, x - 2.05, y + 2.15, z + 2.48, .85, 1.25)
  window(kit, x + 2.05, y + 2.15, z + 2.48, .85, 1.25)
  for (let i = 0; i < 4; i++) kit.box(x, y + .48 - i * .12, z + 2.7 + i * .38, 2.6, .16, .48, 0xc7c3ad, 'stone')
  if (!snow) {
    roof(kit, x, y + 3.18, z + 3.08, 3.1, 1.85, .78, 0x8a7d6c)
    for (const dx of [-1.27, 1.27]) { kit.box(x + dx, y + 1.83, z + 3.42, .17, 2.55, .17, 0x906b49, 'wood'); kit.box(x + dx, y + .8, z + 3.42, .42, .43, .42, 0xb9b5a3, 'stone') }
  }
  kit.box(x - 1.8, y + 5, z - .7, .6, 1.7, .65, 0xa8aea4, 'stone')
  kit.box(x - 1.8, y + 5.88, z - .7, .75, .15, .8, 0x59645f)
}

export function pavilion(kit: NativeKit, x: number, z: number) {
  const y = heightAt(x, z)
  kit.box(x, y + .2, z, 8, .4, 5.8, 0xb9bba8, 'stone')
  kit.box(x, y + 3.0, z - 2.5, 7.6, 5.5, .16, 0xa1aa8b)
  kit.box(x - 3.7, y + 3.0, z, .16, 5.5, 5.1, 0xa1aa8b)
  for (const level of [.4, 3.1, 6.0]) kit.box(x, y + level, z, 8, .23, 5.5, level < 6 ? 0xbba97d : 0xc3c5b5)
  kit.box(x, y + 6.18, z, 8.4, .3, 5.9, 0xc4c6b8)
  for (let dx = -3.7; dx <= 3.8; dx += 1.23) kit.box(x + dx, y + 3.1, z + 2.6, .12, 5.6, .13, 0x536956)
  for (let dx = -3.7; dx < 3.5; dx += 1.23) for (const level of [1.7, 4.6]) kit.box(x + dx + .58, y + level, z + 2.61, 1.05, 2.42, .035, 0x86aaa2, 'glass')
  for (let dz = -2.5; dz <= 2.6; dz += 1.25) kit.box(x + 3.7, y + 3.1, z + dz, .12, 5.6, .13, 0x536956)
  for (const level of [.6, 3.3]) {
    kit.box(x + 1.65, y + level + .8, z + 1.9, 2.1, .1, .85, 0xc2ac7b)
    for (const dx of [.8, 2.5]) kit.box(x + dx, y + level + .38, z + 1.9, .1, .75, .1, 0x64715b)
    kit.box(x + 1.65, y + level + 1.1, z + 2.02, .7, .46, .09, 0x3d514e)
    kit.box(x + 1.65, y + level + 1.1, z + 2.08, .56, .32, .015, 0xa4c4b5)
    kit.box(x + 1.65, y + level + 1.1, z + .71, .56, .32, .015, 0x88b5ae)
    for (let row = 0; row < 3; row++) {
      kit.box(x - 1.7, y + level + row * .63 + .2, z + 1.45, 2.3, .09, .5, 0xa8976e)
      for (let i = 0; i < 9; i++) kit.box(x - 2.68 + i * .25, y + level + row * .63 + .45, z + 1.5, .17, .44, .32, [0xa76650, 0x698784, 0xc0ad79, 0x70825c][i % 4])
    }
  }
  kit.box(x, y + 1.75, z + 2.75, 1.03, 2.45, .1, 0x8e9f79, 'wood', [0, -.4, 0])
}

export function archive(kit: NativeKit, x: number, z: number) {
  const y = heightAt(x, z)
  kit.cylinder(x, y + .25, z, 4.3, 4.6, .5, 0xb9b7a0, 24)
  kit.cylinder(x, y + 2.25, z, 3.8, 3.8, 4, 0xc1b994, 24)
  const dome = new THREE.SphereGeometry(4.4, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2)
  kit.add(dome, 0x657d77, [x, y + 4.22, z], [1, .42, 1]); dome.dispose()
  for (let i = 0; i < 16; i++) {
    const angle = i / 16 * Math.PI * 2
    kit.line(Array.from({ length: 13 }, (_, index) => {
      const latitude = index / 12 * Math.PI / 2
      return new THREE.Vector3(x + Math.sin(latitude) * Math.cos(angle) * 4.4, y + 4.22 + Math.cos(latitude) * 1.848, z + Math.sin(latitude) * Math.sin(angle) * 4.4)
    }))
  }
  kit.cylinder(x, y + 6.18, z, .24, .24, .44, 0x788d82)
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2
    const px = x + Math.sin(a) * 3.84, pz = z + Math.cos(a) * 3.84
    kit.box(px, y + 2.5, pz, .85, 1.55, .1, 0x557b7d, 'window', [0, a, 0])
    kit.cylinder(x + Math.sin(a) * 4.1, y + 2.15, z + Math.cos(a) * 4.1, .12, .15, 3.9, 0x8d8f72)
  }
  kit.box(x, y + 1.45, z + 4.0, 1.4, 2.4, .16, 0x5d6550, 'wood')
  for (let i = 0; i < 3; i++) kit.box(x, y + .35 - i * .1, z + 4.3 + i * .36, 2.5, .15, .45, 0xb9b8a4)
}

export function workshop(kit: NativeKit, x: number, z: number) {
  const y = heightAt(x, z)
  kit.box(x, y + .2, z, 8.7, .4, 5.8, 0xaaa794, 'stone')
  kit.box(x, y + 2.15, z, 8.1, 3.9, 5.2, 0xba9366, 'wood')
  roof(kit, x, y + 4.1, z, 9.2, 6.2, 1.3, 0x9c6853)
  kit.box(x + .8, y + 1.8, z + 2.66, 2.8, 3.1, .13, 0x344c41)
  for (const dx of [-.65, 2.25]) kit.box(x + dx, y + 1.8, z + 2.8, .16, 3.2, .15, 0x88663f)
  window(kit, x - 2.75, y + 2.4, z + 2.64)
  kit.box(x + .8, y + 1.2, z + 1.0, 2.2, .14, .9, 0xb49a62)
  kit.box(x + .8, y + 1.57, z + 1.0, .8, .55, .5, 0x6b8180)
  for (const dx of [-2.5, -.8, .9, 2.6]) kit.box(x + dx, y + 4.84, z - 1.1, 1.4, .12, 1.8, 0x3e6979, 'plain', [0, 0, -.24])
}

export function waterfront(kit: NativeKit, x: number, z: number) {
  const y = heightAt(x, z)
  for (let building = 0; building < 3; building++) {
    const px = x - 6 + building * 5.3, h = [6.9, 8.1, 6.4][building]
    kit.box(px, y + h / 2, z, 5.1, h, 4.2, [0xc2ba98, 0xd5c397, 0xb2b89e][building], 'stone')
    kit.box(px, y + h + .08, z, 5.4, .22, 4.5, 0xc8c3ab)
    for (const dx of [-1.35, 1.35]) {
      window(kit, px + dx, y + h - 1.5, z + 2.15, .7, 1.2)
      const opening = new THREE.Shape()
      opening.moveTo(-.59, 0); opening.lineTo(.59, 0); opening.lineTo(.59, 2.3); opening.absarc(0, 2.3, .59, 0, Math.PI, false); opening.lineTo(-.59, 0); opening.closePath()
      const doorway = new THREE.ExtrudeGeometry(opening, { depth: .11, bevelEnabled: false })
      kit.add(doorway, 0x37584f, [px + dx, y + .04, z + 2.14]); doorway.dispose()
      const arch = new THREE.TorusGeometry(.65, .13, 6, 18, Math.PI)
      kit.add(arch, 0xd0c6a5, [px + dx, y + 2.34, z + 2.29]); arch.dispose()
    }
    kit.box(px, y + 3.95, z + 2.75, 4.4, .12, 1.15, 0xad5d47, 'plain', [.14, 0, 0])
    for (let i = 0; i < 8; i++) kit.box(px - 2.2 + (i + .5) * .55, y + 3.77, z + 3.29, .55, .23, .06, i % 2 ? 0xceb98d : 0xad5d47)
  }
  kit.box(x - .6, .5, z + 6.1, 23, 1.1, 4.4, 0xb7bba9, 'stone')
  for (let i = -3; i <= 3; i++) {
    const px = x + i * 2.5
    kit.cylinder(px, 1.23, z + 7.8, .16, .2, .23, 0x455a52)
  }
}

export function boat(kit: NativeKit, x: number, z: number) {
  const silhouette = new THREE.Shape(); silhouette.moveTo(-.95, -3); silhouette.quadraticCurveTo(-1.4, 1.2, 0, 3.5); silhouette.quadraticCurveTo(1.4, 1.2, .95, -3); silhouette.closePath()
  const hull = new THREE.ExtrudeGeometry(silhouette, { depth: .56, bevelEnabled: true, bevelThickness: .08, bevelSize: .09, bevelSegments: 2 })
  kit.add(hull, 0xd5d3b8, [x, .65, z], [1, 1, 1], [Math.PI / 2, 0, 0], 'plain', true); hull.dispose()
  const deck = new THREE.ShapeGeometry(silhouette)
  kit.add(deck, 0xa79062, [x, .67, z], [1, 1, 1], [-Math.PI / 2, 0, 0]); deck.dispose()
  kit.cylinder(x, 4, z, .055, .075, 6.6, 0x765e42, 8)
  kit.box(x, .96, z - 1.5, 1.45, .55, 1.75, 0x5c746f)
  kit.box(x, 1.5, z, .13, .22, 3.5, 0xb05c45)
  const sail = new THREE.Shape(); sail.moveTo(0, 0); sail.lineTo(0, 4.8); sail.quadraticCurveTo(1.3, 2.1, 2.65, 0); sail.closePath()
  const cloth = new THREE.ExtrudeGeometry(sail, { depth: .018, bevelEnabled: false })
  kit.add(cloth, 0xd6caa6, [x + .08, 1.65, z - .1], [1, 1, 1], [0, Math.PI / 2, 0], 'plain', true); cloth.dispose()
  kit.line([new THREE.Vector3(x, 7.3, z), new THREE.Vector3(x, .7, z + 3), new THREE.Vector3(x, 7.3, z), new THREE.Vector3(x, .7, z - 3)])
}

export function bench(kit: NativeKit, x: number, z: number) {
  const y = heightAt(x, z)
  for (let i = 0; i < 3; i++) { kit.box(x, y + .65, z + i * .18, 2.2, .08, .15, 0xb69b66); kit.box(x, y + .95 + i * .17, z - .12, 2.2, .14, .08, 0xb69b66) }
  for (const dx of [-.8, .8]) { kit.box(x + dx, y + .35, z + .16, .12, .65, .12, 0x556854); kit.box(x + dx, y + .8, z - .14, .1, 1.4, .1, 0x556854) }
}

export function resident(kit: NativeKit, x: number, z: number, coat = 0x77937c) {
  const y = heightAt(x, z)
  kit.cylinder(x, y + .84, z, .18, .16, .58, coat, 8)
  kit.ball(x, y + 1.3, z, .17, .19, .17, 0xa88060, 'plain')
  kit.ball(x, y + 1.4, z - .015, .175, .1, .175, 0x3b514b, 'plain')
  for (const side of [-1, 1]) {
    kit.branch(new THREE.Vector3(x + side * .09, y + .58, z), new THREE.Vector3(x + side * .09, y + .08, z), .068, 0x455e65)
    kit.box(x + side * .09, y + .07, z + .03, .13, .1, .22, 0x35473c)
    kit.branch(new THREE.Vector3(x + side * .21, y + 1.03, z), new THREE.Vector3(x + side * .25, y + .64, z), .058, coat)
  }
}

export function gardenWall(kit: NativeKit, x: number, z: number, length: number) {
  const rand = seeded(Math.round(x * 173 + z * 211))
  for (let dx = -length / 2; dx < length / 2; dx += .73) {
    const y = heightAt(x + dx, z), h = .7 + rand() * .1
    kit.box(x + dx, y + h / 2, z, .71, h, .46, [0xb5b5a0, 0xc0baa3, 0xaaaE9a][Math.floor(rand() * 3)], 'stone')
    kit.box(x + dx, y + h + .08, z, .76, .17, .57, 0xc9c5af, 'plain', [0, (rand() - .5) * .04, (rand() - .5) * .025])
  }
}

export function planter(kit: NativeKit, x: number, z: number) {
  const y = heightAt(x, z)
  kit.cylinder(x, y + .23, z, .3, .22, .46, 0xa57458, 12)
  kit.cylinder(x, y + .47, z, .31, .31, .1, 0xb38868, 12)
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4, dx = Math.sin(a) * .15, dz = Math.cos(a) * .15
    kit.branch(new THREE.Vector3(x + dx, y + .47, z + dz), new THREE.Vector3(x + dx, y + .9 + i * .03, z + dz), .014, 0x608044)
    kit.ball(x + dx, y + .94 + i * .03, z + dz, .09, .07, .09, i % 2 ? 0xd6a49b : 0xdfce8f, 'plain')
  }
}

export function tree(kit: NativeKit, x: number, z: number, size: number, snow = false) {
  const rand = seeded(Math.round(x * 141 + z * 213)), y = heightAt(x, z)
  const acacia = !snow && z > 9 && x > 7
  const crownForm = Math.floor(rand() * 3), crownCount = acacia ? 6 : 5 + Math.floor(rand() * 4)
  kit.branch(new THREE.Vector3(x, y, z), new THREE.Vector3(x + .15 * size, y + 4 * size, z), .28 * size)
  if (snow) {
    for (let tier = 0; tier < 4; tier++) {
      const radius = (1.6 - tier * .31) * size
      const geometry = new THREE.ConeGeometry(radius, 1.65 * size, 12)
      const vertices = geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < vertices.count; i++) if (vertices.getY(i) < 0) {
        const a = Math.atan2(vertices.getZ(i), vertices.getX(i))
        vertices.setY(i, vertices.getY(i) + Math.sin(a * 5 + tier) * .1 * size)
      }
      geometry.computeVertexNormals()
      kit.add(geometry, 0x466967, [x, y + (1.3 + tier * .8) * size, z])
      kit.add(geometry, 0xe1eae5, [x, y + (1.52 + tier * .8) * size, z], [.96, .85, .96], [0, 0, 0], 'snow'); geometry.dispose()
    }
  } else {
    const branchCount = 3 + Math.floor(rand() * 3)
    for (let i = 0; i < branchCount; i++) {
      const a = i * Math.PI * 2 / branchCount + .3
      const branchWidth = acacia ? 1.9 : crownForm === 2 ? 1.05 : 1.4
      kit.branch(new THREE.Vector3(x, y + 2.4 * size, z), new THREE.Vector3(x + Math.cos(a) * branchWidth * size, y + 4.1 * size, z + Math.sin(a) * branchWidth * size), .12 * size)
    }
    for (let i = 0; i < crownCount; i++) {
      const a = i * 2.4, r = i < 5 ? (acacia ? 1.85 : crownForm === 2 ? .8 : 1.4) * size : .38 * size
      const sy = acacia ? .5 : crownForm === 2 ? 1.3 : .72 + rand() * .34
      const sx = (crownForm === 0 ? 1.55 : 1.2) + rand() * .22
      kit.ball(x + Math.cos(a) * r, y + (4.1 + rand() * (acacia ? .25 : .9)) * size, z + Math.sin(a) * r, sx * size, sy * size, (1.12 + rand() * .3) * size, [0x477752, 0x568653, 0x698f51, 0x356849][i % 4])
    }
    for (let root = 0; root < 4; root++) {
      const a = root * Math.PI / 2
      kit.branch(new THREE.Vector3(x, y + .2 * size, z), new THREE.Vector3(x + Math.cos(a) * .7 * size, y + .02, z + Math.sin(a) * .7 * size), .09 * size)
    }
  }
}
