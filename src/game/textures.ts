import * as THREE from 'three'

function makeCanvas(size: number, paint: (ctx: CanvasRenderingContext2D, s: number) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  paint(canvas.getContext('2d')!, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

export function meadowTexture() {
  return makeCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#7cae58'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < 900; i += 1) {
      const shades = ['#6a9e4c', '#8cbb64', '#5f9346', '#97c46e', '#79ab52']
      ctx.fillStyle = shades[i % shades.length]
      ctx.globalAlpha = 0.25 + Math.random() * 0.4
      const x = Math.random() * s
      const y = Math.random() * s
      ctx.beginPath()
      ctx.ellipse(x, y, 2 + Math.random() * 7, 1.5 + Math.random() * 4, Math.random() * 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    for (let i = 0; i < 60; i += 1) {
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(255,250,220,0.14)' : 'rgba(40,70,30,0.12)'
      ctx.lineWidth = 1 + Math.random()
      ctx.beginPath()
      const x = Math.random() * s
      const y = Math.random() * s
      ctx.moveTo(x, y)
      ctx.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30)
      ctx.stroke()
    }
  })
}

export function dirtTexture() {
  return makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#b98d5e'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < 260; i += 1) {
      ctx.fillStyle = ['#a97c4e', '#c69a67', '#9c7045', '#d0a874'][i % 4]
      ctx.globalAlpha = 0.3 + Math.random() * 0.4
      ctx.beginPath()
      ctx.ellipse(Math.random() * s, Math.random() * s, 1 + Math.random() * 5, 1 + Math.random() * 3, Math.random() * 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  })
}

export function softCircleTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.35)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function cloudTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const puffs: Array<[number, number, number]> = [
    [70, 84, 34], [110, 72, 42], [152, 82, 38], [190, 92, 28], [92, 96, 26], [134, 96, 30],
  ]
  puffs.forEach(([x, y, r]) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(255,253,246,0.95)')
    g.addColorStop(0.65, 'rgba(250,247,238,0.6)')
    g.addColorStop(1, 'rgba(248,246,238,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  })
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function flameTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(32, 40, 2, 32, 40, 30)
  gradient.addColorStop(0, 'rgba(255,244,200,1)')
  gradient.addColorStop(0.35, 'rgba(255,190,90,0.9)')
  gradient.addColorStop(0.7, 'rgba(255,120,40,0.45)')
  gradient.addColorStop(1, 'rgba(255,90,20,0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.ellipse(32, 38, 20, 27, 0, 0, Math.PI * 2)
  ctx.fill()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
