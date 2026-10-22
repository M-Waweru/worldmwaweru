import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const sources = '/mnt/c/Users/Mathenge/OneDrive/Pictures/Pinterest'
const output = fileURLToPath(new URL('../public/assets/', import.meta.url))
const assets = [
  ['cottage-art.png', 'download (27).jpg', 'crop=735:615:0:0'],
  ['studio-art.png', 'download (24).jpg', null],
  ['harbour-art.png', 'download (25).jpg', null],
  ['cabin-art.png', 'download (26).jpg', null],
  ['cottage-ground.png', 'download (27).jpg', 'crop=100:80:260:371'],
  ['studio-ground.png', 'download (24).jpg', 'crop=100:80:40:25'],
  ['harbour-ground.png', 'download (25).jpg', 'crop=90:90:20:780'],
  ['cabin-ground.png', 'download (26).jpg', 'crop=128:128:480:690'],
  ['wanderer.png', 'download (27).jpg', 'crop=65:88:390:531,colorkey=0x82b369:0.22:0.05'],
]

function quiltGround(path, width, height) {
  const decoded = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'], { maxBuffer: 16 * 1024 * 1024 })
  if (decoded.status !== 0) throw new Error(String(decoded.stderr))
  const source = decoded.stdout
  const size = 512
  const data = Buffer.alloc(size * size * 4)
  const mean = [0, 0, 0]
  for (let i = 0; i < width * height; i++) for (let c = 0; c < 3; c++) mean[c] += source[i * 4 + c] / (width * height)
  for (let i = 0; i < size * size; i++) { for (let c = 0; c < 3; c++) data[i * 4 + c] = mean[c]; data[i * 4 + 3] = 255 }
  let seed = 361
  const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  const patch = 24
  const overlap = 6
  for (let y = -overlap; y < size; y += patch - overlap) for (let x = -overlap; x < size; x += patch - overlap) {
    const sx = Math.floor(rand() * (width - patch))
    const sy = Math.floor(rand() * (height - patch))
    const mirror = rand() > 0.5
    for (let py = 0; py < patch; py++) for (let px = 0; px < patch; px++) {
      const dx = (x + px + size) % size, dy = (y + py + size) % size
      const from = ((sy + py) * width + sx + (mirror ? patch - 1 - px : px)) * 4
      const to = (dy * size + dx) * 4
      const weight = Math.min(1, (Math.min(px, py, patch - 1 - px, patch - 1 - py) + 1) / overlap)
      for (let c = 0; c < 3; c++) data[to + c] = data[to + c] * (1 - weight) + source[from + c] * weight
    }
  }
  const encoded = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${size}x${size}`, '-i', 'pipe:0', '-frames:v', '1', path], { input: data })
  if (encoded.status !== 0) throw new Error(String(encoded.stderr))
}

for (const [name, source, filter] of assets) {
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${sources}/${source}`]
  if (filter) args.push('-vf', filter)
  args.push('-frames:v', '1', `${output}/${name}`)
  const result = spawnSync('ffmpeg', args, { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`${name}: ${result.stderr}`)
  const quilted = name === 'studio-ground.png' || name === 'harbour-ground.png'
  if (quilted) {
    const [, width, height] = /crop=(\d+):(\d+)/.exec(filter)
    quiltGround(`${output}/${name}`, Number(width), Number(height))
  }
  writeFileSync(`${output}/${name}.provenance.json`, JSON.stringify({
    origin: `User-provided reference: C:\\Users\\Mathenge\\OneDrive\\Pictures\\Pinterest\\${source}`,
    source: `${sources}/${source}`,
    treatment: (filter ?? 'Original illustration converted losslessly to PNG.') + (quilted ? '; seeded 512 × 512 overlapping-patch quilting from the source crop to remove recognizable mirrored repetitions while retaining its native ink marks.' : ''),
    use: name.includes('ground') ? 'Reference-derived terrain texture.' : name === 'wanderer.png' ? 'Reference-derived character cut-out for the Three.js visitor.' : 'Illustrated district plate rendered in Three.js.',
  }, null, 2))
  console.log(`Produced ${name} from ${source}`)
}

const capture = fileURLToPath(new URL('../.impeccable/review/desktop.png', import.meta.url))
const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', capture, '-vf', 'crop=800:620:580:110,scale=800:-1', '-frames:v', '1', `${output}/world-project.png`], { encoding: 'utf8' })
if (result.status !== 0) throw new Error(result.stderr)
writeFileSync(`${output}/world-project.png.provenance.json`, JSON.stringify({ origin: 'Screenshot of the running A Little World website, captured at 1440 × 900 by Playwright.', source: '.impeccable/review/desktop.png', treatment: 'Cropped to the explorable scene, with navigation removed.' }, null, 2))
