import * as THREE from 'three'
import { NativeKit } from './kit'
import { vehicleDefinitions, createVehicleState, type VehicleDefinition, type VehicleState } from '../engine/vehicles'

export type VehicleVisual = { root: THREE.Group; state: VehicleState; definition: VehicleDefinition; update(time: number, dt: number, occupied: boolean): void; dispose(): void }

export function worldLabel(parent: THREE.Group, text: string, y: number, width = 3.6) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#f5f2e7'; ctx.beginPath(); ctx.roundRect(4, 4, 504, 82, 12); ctx.fill()
  ctx.fillStyle = '#2d4435'; ctx.font = '500 32px Karla, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 46, 470)
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }))
  sprite.position.y = y; sprite.scale.set(width, width * 96 / 512, 1); parent.add(sprite)
  return sprite
}

export function buildVehicles(parent: THREE.Group): VehicleVisual[] {
  return vehicleDefinitions.map(definition => {
    const root = new THREE.Group(), kit = new NativeKit(), wheels: THREE.Group[] = []
    const ink = 0x293c3d, metal = 0xb8bdb4, saddle = 0xa58b6b
    let propeller: THREE.Group | null = null, plume: THREE.Mesh | null = null
    const wheel = (x: number, y: number, z: number, radius: number, thickness: number) => {
      const group = new THREE.Group(); group.position.set(x, y, z)
      const tyre = new THREE.Mesh(new THREE.TorusGeometry(radius * .77, radius * .23, 8, 20), kit.material(0x303a36)); tyre.rotation.y = Math.PI / 2
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * .52, radius * .52, thickness, 12), kit.material(0x949e94)); hub.rotation.z = Math.PI / 2
      group.add(tyre, hub)
      for (let i = 0; i < 6; i++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(thickness + .02, radius * 1.05, .045), kit.material(ink)); spoke.rotation.x = i * Math.PI / 3; group.add(spoke)
      }
      root.add(group); wheels.push(group)
    }
    if (definition.id === 'bike') {
      for (const z of [-1.12, 1.12]) wheel(0, .45, z, .45, .18)
      kit.box(0, .68, -.1, .48, .25, 1.8, ink)
      kit.ball(0, .91, .36, .31, .23, .5, 0x6b7472, 'plain')
      kit.box(0, .94, -.52, .49, .14, .95, saddle)
      kit.box(0, 1.02, -.92, .43, .13, .28, saddle)
      kit.box(0, .55, -.15, .5, .4, .54, metal)
      for (const side of [-1, 1]) {
        kit.box(side * .18, .55, .05, .075, .35, .34, ink, 'plain', [-.3, 0, 0])
        kit.branch(new THREE.Vector3(side * .17, .47, 1.12), new THREE.Vector3(side * .17, 1.23, .82), .045, metal)
        kit.box(side * .28, .36, -.7, .14, .14, .95, metal)
        kit.box(side * .37, 1.26, .81, .27, .06, .07, ink)
        kit.branch(new THREE.Vector3(side * .35, 1.26, .8), new THREE.Vector3(side * .43, 1.58, .76), .018, ink)
        kit.box(side * .43, 1.6, .76, .18, .09, .05, metal)
      }
      kit.box(0, 1.15, .92, .3, .26, .15, 0xeee5ba)
      kit.box(0, 1.3, .8, .6, .06, .07, metal)
      kit.box(0, .81, -1.1, .25, .09, .08, 0xb96751)
    } else if (definition.id === 'cruiser') {
      for (const x of [-.98, .98]) for (const z of [-1.38, 1.28]) wheel(x, .61, z, .61, .29)
      kit.box(0, .8, 0, 1.9, .36, 4.1, 0x454b40)
      kit.box(0, 1.18, -.15, 1.98, .57, 3.85, 0xc4bb95)
      kit.box(0, 1.55, 1.15, 1.96, .2, 1.45, 0xc4bb95)
      kit.box(0, 1.93, -.7, 1.85, 1.04, 2.15, 0xbcb58d)
      kit.box(0, 2.5, -.7, 2.02, .16, 2.4, 0xd4ccb0)
      kit.box(0, 2.03, .4, 1.65, .69, .07, 0x527778)
      for (const side of [-1, 1]) {
        for (const z of [-1.26, -.25]) kit.box(side * .94, 2.03, z, .035, .64, .82, 0x658889)
        kit.box(side * 1.12, 1.92, .5, .23, .22, .12, ink)
        kit.box(side * .69, 1.35, 2, .31, .26, .08, 0xf0e6b7)
        kit.box(side * .85, 2.67, -.7, .07, .16, 2.4, ink)
      }
      for (let i = 0; i < 6; i++) kit.box(-.42 + i * .17, 1.32, 2.01, .065, .24, .07, ink)
      kit.box(0, .99, 2.15, 2.2, .18, .23, metal)
      kit.box(0, 2.72, -.7, 1.8, .06, 2.5, ink)
      kit.cylinder(.65, 2.16, .8, .055, .055, 1.9, ink)
      wheel(0, 1.51, -2.06, .5, .25); wheels.at(-1)!.rotation.y = Math.PI / 2
    } else if (definition.id === 'boat') {
      const shape = new THREE.Shape(); shape.moveTo(-.85, -1.8); shape.lineTo(.85, -1.8); shape.quadraticCurveTo(1.2, .6, 0, 2.5); shape.quadraticCurveTo(-1.2, .6, -.85, -1.8)
      const hull = new THREE.ExtrudeGeometry(shape, { depth: .55, bevelEnabled: true, bevelThickness: .08, bevelSize: .06, bevelSegments: 1 })
      kit.add(hull, 0xe0d9b9, [0, .28, 0], [1, 1, 1], [Math.PI / 2, 0, 0], 'plain', true); hull.dispose()
      kit.box(0, .48, -.1, 1.3, .1, 2.9, saddle, 'wood')
      for (const z of [-.9, .75]) kit.box(0, .7, z, 1.4, .15, .38, 0x9a7856, 'wood')
      kit.box(0, .91, -.15, .63, .67, .36, 0x557b75)
      kit.box(0, 1.33, -.07, .72, .35, .06, 0x8ab7ad, 'glass')
      kit.box(0, .67, -1.95, .45, .8, .5, ink)
      kit.cylinder(.73, 1.15, -1.05, .024, .024, 1.45, metal)
      kit.box(.73, 1.65, -.93, .03, .3, .4, 0xb47754)
    } else if (definition.id === 'plane') {
      kit.ball(0, 1.37, -.25, .65, .63, 3.25, 0xd9cfa5, 'plain')
      kit.box(0, 2.15, .06, 9.8, .16, 1.65, 0xb98657)
      kit.box(0, 1.64, -2.7, 3.7, .12, .91, 0xb98657)
      kit.box(0, 2.04, -2.7, .13, 1.6, .83, 0xb98657, 'plain', [-.25, 0, 0])
      kit.box(0, 1.87, .55, 1.1, .64, 1.12, 0x527a80)
      for (const side of [-1, 1]) {
        kit.branch(new THREE.Vector3(side * .45, .9, .25), new THREE.Vector3(side * 3.2, 2.15, .3), .04, metal)
        kit.branch(new THREE.Vector3(side * .45, .9, .5), new THREE.Vector3(side * 1.1, .44, .9), .06, ink)
        wheel(side * 1.1, .43, .9, .43, .24)
        kit.box(side * 4.75, 2.24, .1, .12, .08, .3, side < 0 ? 0xa95c50 : 0x729569)
      }
      wheel(0, .24, -2.6, .23, .1)
      propeller = new THREE.Group(); propeller.position.set(0, 1.4, 3)
      for (const angle of [0, Math.PI / 2]) { const blade = new THREE.Mesh(new THREE.BoxGeometry(.15, 2.25, .1), kit.material(ink)); blade.rotation.z = angle; propeller.add(blade) }
      root.add(propeller)
    } else {
      kit.cylinder(0, 4.15, 0, 1.02, 1.02, 6.3, 0xc0c8c3, 20)
      kit.cylinder(0, 8.05, 0, 0, 1.02, 1.5, 0xc0c8c3, 20)
      kit.box(0, 5, -.93, 1.1, 4.4, .2, 0x38494c)
      for (const y of [1.7, 2.6, 3.5, 4.4, 5.3, 6.2]) {
        const ring = new THREE.TorusGeometry(1.025, .018, 4, 24); kit.add(ring, 0x6c7b76, [0, y, 0], [1, 1, 1], [Math.PI / 2, 0, 0]); ring.dispose()
      }
      for (const side of [-1, 1]) {
        kit.box(side * 1.1, 2.1, 0, .15, 2.7, 1.4, metal, 'plain', [0, 0, side * -.24])
        kit.box(side * .98, 6.7, 0, .13, 1.3, .85, metal, 'plain', [0, 0, side * -.25])
        kit.branch(new THREE.Vector3(side * .7, 1.5, 0), new THREE.Vector3(side * 1.65, .09, 0), .085, ink)
        kit.box(side * 1.65, .1, 0, .6, .15, .55, ink)
      }
      for (const x of [-.4, 0, .4]) kit.cylinder(x, .66, 0, .16, .24, .5, ink, 10)
      plume = new THREE.Mesh(new THREE.ConeGeometry(.65, 4.8, 12), new THREE.MeshBasicMaterial({ color: 0xffb34e, transparent: true, opacity: .85, depthWrite: false }))
      plume.position.y = -1.7; plume.rotation.z = Math.PI; plume.visible = false; root.add(plume)
    }
    kit.commit(root)
    const label = worldLabel(root, definition.name, definition.id === 'rocket' ? 10 : definition.id === 'plane' ? 3.3 : 3)
    const state = createVehicleState(definition)
    root.position.set(state.x, state.y, state.z); root.rotation.y = state.heading; parent.add(root)
    let heading = state.heading
    return { root, state, definition,
      update(time, dt, occupied) {
        root.position.set(state.x, state.y + (definition.id === 'boat' ? Math.sin(time * 1.4) * .035 : 0), state.z)
        root.rotation.y = state.heading
        const turn = dt > 0 ? Math.atan2(Math.sin(state.heading - heading), Math.cos(state.heading - heading)) / dt : 0
        root.rotation.z = definition.id === 'bike' ? -turn * Math.min(Math.abs(state.speed) / 25, .3) : definition.id === 'plane' && state.phase === 'flying' ? -turn * .35 : 0
        for (const rolling of wheels) rolling.rotation.x += state.speed * dt * 2
        if (propeller) propeller.rotation.z += (state.phase === 'parked' && Math.abs(state.speed) < .1 ? 0 : 40) * dt
        if (plume) { plume.visible = state.phase !== 'parked'; plume.scale.y = (state.phase === 'hovering' ? .35 : state.phase === 'landing' ? .5 : 1) + Math.sin(time * 28) * .05 }
        label.visible = !occupied; heading = state.heading; kit.update(time)
      },
      dispose() { kit.disposeTextures(); kit.gradient.dispose() },
    }
  })
}
