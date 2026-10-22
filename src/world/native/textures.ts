import * as THREE from 'three'

/** Original, seeded surface paintings. These are native material inputs, not scene backdrops. */
export function createGardenTextures() {
  const textures: Record<string, THREE.CanvasTexture> = {}
  const paint = (name: string, painter: (context: CanvasRenderingContext2D, size: number, random: () => number) => void) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256
    const context = canvas.getContext('2d')!
    let seed = 941 + name.length * 71
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
    painter(context, 256, random)
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4
    textures[name] = texture
    return canvas
  }
  const grain = (ctx: CanvasRenderingContext2D, s: number, random: () => number, count = 9000, alpha = .08) => {
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = `rgba(62,64,43,${random() * alpha})`
      ctx.fillRect(random() * s, random() * s, .3 + random() * 1.2, .3 + random() * 1.1)
    }
  }
  paint('plain', (ctx, s, random) => { ctx.fillStyle = '#fbfaf1'; ctx.fillRect(0, 0, s, s); grain(ctx, s, random, 6500, .04) })
  paint('wood', (ctx, s, random) => {
    ctx.fillStyle = '#f0e2c9'; ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < 180; i++) {
      const y = random() * s; ctx.lineWidth = .4 + random() * .7; ctx.strokeStyle = `rgba(78,54,31,${.03 + random() * .1})`; ctx.beginPath()
      for (let x = 0; x <= s; x += 5) { const py = y + Math.sin(x * .036 + i * .3) * 2; if (x) ctx.lineTo(x, py); else ctx.moveTo(x, py) } ctx.stroke()
    }
    for (let i = 0; i < 5; i++) {
      const x = random() * s, y = random() * s
      for (let k = 0; k < 7; k++) { ctx.strokeStyle = 'rgba(78,54,31,.1)'; ctx.beginPath(); ctx.ellipse(x, y, 3 + k * 3, 1 + k * .7, 0, 0, Math.PI * 2); ctx.stroke() }
    }
    grain(ctx, s, random)
  })
  paint('stone', (ctx, s, random) => {
    ctx.fillStyle = '#eeeee5'; ctx.fillRect(0, 0, s, s); grain(ctx, s, random, 17000, .11)
    for (let i = 0; i < 18; i++) { ctx.strokeStyle = 'rgba(76,86,69,.1)'; ctx.lineWidth = .5; const x = random() * s, y = random() * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + random() * 12, y + 9); ctx.lineTo(x + random() * 16, y + 24); ctx.stroke() }
  })
  paint('leaf', (ctx, s, random) => {
    ctx.fillStyle = '#eef2e1'; ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < 1600; i++) { ctx.fillStyle = `rgba(87,108,55,${.02 + random() * .11})`; ctx.beginPath(); ctx.ellipse(random() * s, random() * s, 1 + random() * 5, .6 + random() * 2, random() * 6, 0, Math.PI * 2); ctx.fill() }
    grain(ctx, s, random, 5000, .045)
  })
  paint('earth', (ctx, s, random) => {
    ctx.fillStyle = '#f2eddb'; ctx.fillRect(0, 0, s, s); grain(ctx, s, random, 21000, .1)
    for (let i = 0; i < 70; i++) { const x = random() * s, y = random() * s; ctx.strokeStyle = 'rgba(96,112,60,.12)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 4 - random() * 5); ctx.stroke() }
  })
  paint('roof', (ctx, s, random) => {
    ctx.fillStyle = '#f1e8d9'; ctx.fillRect(0, 0, s, s)
    for (let y = 0; y < s; y += 24) for (let x = -30; x < s; x += 40) { const offset = (y / 24 % 2) * 20; ctx.fillStyle = `rgba(81,75,55,${.02 + random() * .08})`; ctx.fillRect(x + offset, y, 39, 23); ctx.strokeStyle = 'rgba(82,78,61,.16)'; ctx.lineWidth = .65; ctx.strokeRect(x + offset, y, 40, 24) }
    grain(ctx, s, random)
  })
  paint('snow', (ctx, s, random) => { ctx.fillStyle = '#fcfdfc'; ctx.fillRect(0, 0, s, s); grain(ctx, s, random, 7500, .018) })
  paint('paving', (ctx, s, random) => { ctx.fillStyle = '#f2efe0'; ctx.fillRect(0, 0, s, s); grain(ctx, s, random, 15000, .08) })
  paint('flower', (ctx) => {
    for (let i = 0; i < 7; i++) { ctx.save(); ctx.translate(128, 128); ctx.rotate(i / 7 * Math.PI * 2); ctx.fillStyle = i % 2 ? '#fff8dc' : '#f2ecd4'; ctx.beginPath(); ctx.ellipse(0, -48, 24, 41, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore() }
    ctx.fillStyle = '#c3a15f'; ctx.beginPath(); ctx.arc(128, 128, 27, 0, Math.PI * 2); ctx.fill()
  })
  const paper = paint('paper', (ctx, s, random) => {
    ctx.fillStyle = '#f3f2e9'; ctx.fillRect(0, 0, s, s); grain(ctx, s, random, 5000, .018)
    for (let i = 0; i < 100; i++) { const x = random() * s, y = random() * s; ctx.strokeStyle = 'rgba(102,98,77,.02)'; ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y + 1); ctx.stroke() }
  })
  document.documentElement.style.setProperty('--garden-paper-texture', `url("${paper.toDataURL()}")`)
  return textures
}
