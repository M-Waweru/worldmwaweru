import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const metadataPath = path.join(root, 'public/assets/world-project.png.provenance.json')
const metadata = JSON.parse(await readFile(metadataPath, 'utf8'))
if (metadata.source?.startsWith('docs/provenance/')) {
  const bytes = await readFile(path.join(root, metadata.source))
  if (createHash('sha256').update(bytes).digest('hex') !== metadata.source_sha256) throw new Error('Archived thumbnail source digest differs.')
  console.log('Thumbnail provenance is already portable.'); process.exit(0)
}
const originalSource = path.resolve(root, '..', metadata.source)
const bytes = await readFile(originalSource)
const sourceHash = createHash('sha256').update(bytes).digest('hex')
if (metadata.source_sha256 !== sourceHash) throw new Error('Original scene capture does not match its provenance.')
await mkdir(path.join(root, 'docs/provenance'), { recursive: true })
const archived = `docs/provenance/world-project-source-${sourceHash.slice(0, 16)}.png`
await copyFile(originalSource, path.join(root, archived))
await writeFile(metadataPath, JSON.stringify({ ...metadata, originalSource: metadata.source, source: archived, publicationNote: 'The immutable raw scene capture is archived in this repository. Existing embedded origin metadata retains the original production-stage path.' }, null, 2) + '\n')
console.log(`Archived exact native-scene source at ${archived}`)
