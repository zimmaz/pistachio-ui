import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { compareModelVersions, isVersionAfter, parseModelVersion } from './model-version.ts'

describe('parseModelVersion', () => {
  it('parses numeric versions', () => {
    assert.equal(parseModelVersion('v8'), 8)
    assert.equal(parseModelVersion('v9'), 9)
    assert.equal(parseModelVersion('v10'), 10)
    assert.equal(parseModelVersion('v11'), 11)
    assert.equal(parseModelVersion('v18'), 18)
    assert.equal(parseModelVersion('v19'), 19)
    assert.equal(parseModelVersion('v20'), 20)
    assert.equal(parseModelVersion('v100'), 100)
  })

  it('rejects malformed input', () => {
    assert.equal(parseModelVersion(''), null)
    assert.equal(parseModelVersion('18'), null)
    assert.equal(parseModelVersion('v'), null)
    assert.equal(parseModelVersion('version-19'), null)
  })
})

describe('compareModelVersions', () => {
  it('orders across the single-digit to multi-digit boundary', () => {
    assert.ok(compareModelVersions('v10', 'v9') > 0)
    assert.ok(compareModelVersions('v9', 'v10') < 0)
    assert.ok(compareModelVersions('v11', 'v10') > 0)
  })

  it('orders later demo versions', () => {
    assert.ok(compareModelVersions('v20', 'v19') > 0)
    assert.ok(compareModelVersions('v100', 'v20') > 0)
    assert.equal(compareModelVersions('v18', 'v18'), 0)
  })

  it('does not use lexicographic string order', () => {
    assert.notEqual('v10' < 'v9', compareModelVersions('v10', 'v9') < 0)
    assert.ok(isVersionAfter('v10', 'v9'))
    assert.ok(isVersionAfter('v20', 'v19'))
    assert.ok(isVersionAfter('v100', 'v20'))
    assert.equal(isVersionAfter('v18', 'v19'), false)
  })
})
