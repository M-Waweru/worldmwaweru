import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const target = path.join(root, '.impeccable/design.json')
const sidecar = JSON.parse(await readFile(target, 'utf8'))
const files = sidecar.extensions.bindings.files, mismatches = []
for (const file of Object.keys(files)) {
  const digest = createHash('sha256').update(await readFile(path.join(root, file))).digest('hex')
  if (process.argv.includes('--check')) { if (files[file] !== digest) mismatches.push(file) }
  else files[file] = digest
}
if (process.argv.includes('--check')) {
  if (mismatches.length) { console.error(`Stale bindings: ${mismatches.join(', ')}`); process.exitCode = 1 }
  else console.log(`Verified ${Object.keys(files).length} raw-byte SHA-256 design bindings.`)
} else {
  sidecar.generatedAt = new Date().toISOString()
  await writeFile(target, JSON.stringify(sidecar, null, 2) + '\n')
  console.log(`Refreshed ${Object.keys(files).length} design bindings; review scope retained.`)
}
