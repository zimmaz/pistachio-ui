import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const src = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib')
const visibility = readFileSync(join(src, 'model-visibility.ts'), 'utf8')
assert.equal(visibility.includes('proposedInVersion >'), false, 'visibility must not compare version strings lexicographically')
assert.equal(visibility.includes('isVersionAfter'), true, 'visibility must use numeric version comparison')

function parseModelVersion(value) {
  if (typeof value !== 'string') return null
  const match = value.trim().match(/^v(\d+)$/i)
  if (!match) return null
  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : null
}

function compareModelVersions(a, b) {
  const left = parseModelVersion(a)
  const right = parseModelVersion(b)
  if (left === null && right === null) return 0
  if (left === null) return -1
  if (right === null) return 1
  return left - right
}

function isVersionAfter(version, than) {
  return compareModelVersions(version, than) > 0
}

const cases = [
  ['v8', 8],
  ['v9', 9],
  ['v10', 10],
  ['v11', 11],
  ['v18', 18],
  ['v19', 19],
  ['v20', 20],
  ['v100', 100],
]
for (const [input, expected] of cases) {
  assert.equal(parseModelVersion(input), expected, `parse ${input}`)
}

assert.equal(parseModelVersion(''), null)
assert.equal(parseModelVersion('18'), null)
assert.equal(parseModelVersion('version-19'), null)

assert.ok(compareModelVersions('v10', 'v9') > 0, 'v10 > v9')
assert.ok(compareModelVersions('v9', 'v10') < 0, 'v9 < v10')
assert.ok(compareModelVersions('v20', 'v19') > 0, 'v20 > v19')
assert.ok(compareModelVersions('v100', 'v20') > 0, 'v100 > v20')
assert.equal(compareModelVersions('v18', 'v18'), 0)
assert.ok(isVersionAfter('v10', 'v9'))
assert.ok(isVersionAfter('v20', 'v19'))
assert.ok(isVersionAfter('v100', 'v20'))
assert.equal(isVersionAfter('v18', 'v19'), false)
assert.notEqual('v10' < 'v9', compareModelVersions('v10', 'v9') < 0, 'must not match lexical order')

console.log('Version ordering checks passed.')
