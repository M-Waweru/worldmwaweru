import { constants } from 'node:fs'
import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const source = path.join(root, '.impeccable/review/mwaweru-upgrade/world-project.png')
const target = path.join(root, 'public/assets/world-project.png')
const intermediate = path.join(root, '.asset-staging/world-project-mwaweru.png')
const sourceBytes = await readFile(source)
const sourceHash = createHash('sha256').update(sourceBytes).digest('hex')
const archivedSource = path.join(root, `.asset-staging/world-project-source-${sourceHash.slice(0, 16)}.png`)
try { await writeFile(archivedSource, sourceBytes, { flag: 'wx' }) } catch (error) { if (error.code !== 'EEXIST') throw error }
for (const suffix of ['', '.provenance.json']) {
  try { await copyFile(`${target}${suffix}`, path.join(root, `.asset-staging/world-project-before-mwaweru.png${suffix}`), constants.COPYFILE_EXCL) }
  catch (error) { if (error.code !== 'EEXIST' && error.code !== 'ENOENT') throw error }
}
await new Promise((resolve, reject) => {
  const process = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', archivedSource, '-vf', 'crop=800:620:580:110', '-frames:v', '1', intermediate], { stdio: ['ignore', 'ignore', 'pipe'] })
  const errors = []; process.stderr.on('data', data => errors.push(data))
  process.once('error', reject); process.once('close', code => code === 0 ? resolve() : reject(new Error(Buffer.concat(errors).toString())))
})
const origin = `Origin: Screenshot of the actual running upgraded Mwaweru native Three.js garden, captured with Playwright at 1440x900. Immutable source: ${path.relative(root, archivedSource)}. Treatment: 800x620 crop at x=580,y=110. Original procedural scene geometry and painted material textures; no image generation or reference-photo compositing.`
const original = await readFile(intermediate)
if (original.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Expected a decoded PNG screenshot')
const table = new Uint32Array(256)
for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[i] = c >>> 0 }
const text = Buffer.from(`impeccable:prompt\0${origin}`, 'utf8'), chunk = Buffer.alloc(text.length + 12)
chunk.writeUInt32BE(text.length); chunk.write('tEXt', 4); text.copy(chunk, 8)
let crc = 0xffffffff
for (const byte of chunk.subarray(4, 8 + text.length)) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8)
chunk.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 8 + text.length)
let end = 8
while (end + 12 <= original.length && original.toString('ascii', end + 4, end + 8) !== 'IEND') end += original.readUInt32BE(end) + 12
const png = Buffer.concat([original.subarray(0, end), chunk, original.subarray(end)])
await writeFile(target, png)
await writeFile(`${target}.provenance.json`, JSON.stringify({ origin, source: path.relative(root, archivedSource), capture: path.relative(root, source), source_sha256: sourceHash, treatment: 'Crop 800 x 620 at x=580, y=110; actual native scene screenshot.', sha256: createHash('sha256').update(png).digest('hex') }, null, 2))
console.log('Published the upgraded native scene thumbnail; previous asset and provenance retained in .asset-staging/.')
