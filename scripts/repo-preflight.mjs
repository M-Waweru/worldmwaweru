import { execFileSync } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, '')
const gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8' }).trim()
if (gitRoot !== root) throw new Error('Preflight must run in the standalone worldmwaweru repository.')
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean))]
const failures = []
const credentials = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{50,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bsk_live_[A-Za-z0-9]{20,}\b/,
]
let bytes = 0
for (const file of files) {
  if (/(?:^|\/)(?:node_modules|dist|\.git|\.asset-staging|\.env)(?:\/|$)/.test(file)) { failures.push({ file, reason: 'Non-publishable path' }); continue }
  const info = await stat(path.join(root, file)); bytes += info.size
  if (info.size > 95 * 1024 * 1024) failures.push({ file, reason: 'Exceeds repository asset budget' })
  const buffer = await readFile(path.join(root, file))
  if (!buffer.includes(0)) for (const pattern of credentials) if (pattern.test(buffer.toString('utf8'))) { failures.push({ file, reason: 'Potential private credential; inspect before committing' }); break }
}
if (failures.length) { console.error(JSON.stringify({ failures }, null, 2)); process.exitCode = 1 }
else console.log(JSON.stringify({ result: 'passed', publishableFiles: files.length, totalMegabytes: Math.round(bytes / 1024 / 1024 * 100) / 100, privateCredentialMatches: 0 }, null, 2))
