import * as THREE from 'three'

export const colors = { ink: 0x293d30, grass: 0x8bac70 }

export const artDimensions = {
  cottage: { aspect: 735 / 615, color: 0x81b369, anchor: [-0.15, 0.15] },
  studio: { aspect: 736 / 906, color: 0x9daa6d, anchor: [0, 0] },
  harbour: { aspect: 735 / 933, color: 0x76ac95, anchor: [0, 0] },
  cabin: { aspect: 736 / 1062, color: 0xe9ebeb, anchor: [0, 0] },
}

export function makeWanderer(parent: THREE.Group) {
  const texture = new THREE.TextureLoader().load('/assets/wanderer.png')
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
  sprite.scale.set(0.75, 1.02, 1)
  sprite.center.set(0.5, 0)
  sprite.renderOrder = 5
  const group = new THREE.Group()
  group.add(sprite)
  group.userData.parts = []
  parent.add(group)
  return group
}
