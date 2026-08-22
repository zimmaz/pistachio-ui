import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data')

function ids(file, pattern) {
  const text = readFileSync(join(root, file), 'utf8')
  return new Set([...text.matchAll(pattern)].map((match) => match[1]))
}

const catalogs = {
  evidence: ids('evidence.ts', /(?:id: '|e\(')(EV-\d+)/g),
  findings: ids('findings.ts', /\bid: '(FIND-\d+)'/g),
  threats: ids('model.ts', /\b(?:id: '|t\(')(TM-\d+)/g),
  components: ids('model.ts', /\bid: '(CMP-\d+)'/g),
  reviews: ids('reviews.ts', /\bid: '(REV-\d+)'/g),
  decisions: ids('model.ts', /\bid: '(EXC-\d+)'/g),
  agents: ids('agents.ts', /\bid: '(AGT-\d+)'/g),
  paths: ids('model.ts', /\bid: '(AP-\d+)'/g),
  assumptions: ids('model.ts', /(?:id: '|a\(')(ASM-[\dA-Z]+)/g),
  flows: ids('model.ts', /\bid: '(DF-\d+)'/g),
  controls: ids('model.ts', /\b(?:id: '|c\(')(CTRL-\d+)/g),
}

const files = ['reviews.ts', 'findings.ts', 'model.ts', 'evidence.ts', 'agents.ts', 'activity.ts', 'assistant.ts', 'provenance.ts', 'project.ts']
const missing = []

for (const file of files) {
  const text = readFileSync(join(root, file), 'utf8')
  const checks = [
    [/\b(EV-\d+)\b/g, 'evidence'],
    [/\b(FIND-\d+)\b/g, 'findings'],
    [/\b(TM-\d+)\b/g, 'threats'],
    [/\b(CMP-\d+)\b/g, 'components'],
    [/\b(REV-\d+)\b/g, 'reviews'],
    [/\b(EXC-\d+)\b/g, 'decisions'],
    [/\b(AGT-\d+)\b/g, 'agents'],
    [/\b(AP-\d+)\b/g, 'paths'],
    [/\b(ASM-[\dA-Z]+)\b/g, 'assumptions'],
    [/\b(DF-\d+)\b/g, 'flows'],
    [/\b(CTRL-\d+)\b/g, 'controls'],
  ]
  for (const [pattern, kind] of checks) {
    for (const match of text.matchAll(pattern)) {
      if (!catalogs[kind].has(match[1])) missing.push(`${file}: unknown ${kind} ${match[1]}`)
    }
  }
}

const unique = [...new Set(missing)]
if (unique.length) {
  console.error(`Broken references (${unique.length}):`)
  for (const line of unique) console.error(`  ${line}`)
  process.exit(1)
}

console.log('Demo data references resolve.')
for (const [kind, set] of Object.entries(catalogs)) {
  console.log(`  ${kind}: ${set.size}`)
}

const modelText = readFileSync(join(root, 'model.ts'), 'utf8')
const reviewText = readFileSync(join(root, 'reviews.ts'), 'utf8')
const semantic = []

function nearestId(before) {
  const matches = []
  for (const match of before.matchAll(/^    id: '([A-Z]+-[\dA-Z]+)'/gm)) {
    matches.push({ id: match[1], index: match.index ?? 0 })
  }
  for (const match of before.matchAll(/(?:\.\.\.)?t\('(TM-\d+)'/g)) {
    matches.push({ id: match[1], index: match.index ?? 0 })
  }
  for (const match of before.matchAll(/(?:\.\.\.)?c\('(CTRL-\d+)'/g)) {
    matches.push({ id: match[1], index: match.index ?? 0 })
  }
  return matches.sort((a, b) => a.index - b.index).at(-1)?.id
}

function objectsWithField(text, field) {
  const found = []
  const pattern = new RegExp(`${field}: '([^']+)'`, 'g')
  let match
  while ((match = pattern.exec(text))) {
    const id = nearestId(text.slice(Math.max(0, match.index - 5000), match.index))
    if (id) found.push({ id, value: match[1] })
  }
  return found
}

const addedByReview = {}
const reviewChunks = reviewText.split(/id: '(REV-\d+)'/)
for (let i = 1; i < reviewChunks.length; i += 2) {
  const body = reviewChunks[i + 1] ?? ''
  addedByReview[reviewChunks[i]] = new Set(
    [...body.matchAll(/\{ op: 'added', group: '[^']+', id: '([^']+)'/g)].map((item) => item[1]),
  )
}

const proposedByReview = {}
for (const item of objectsWithField(modelText, 'proposalId')) {
  proposedByReview[item.value] ??= new Set()
  proposedByReview[item.value].add(item.id)
}

const isModelEntity = (id) => /^(CMP|DF|TM|AP|TB|CTRL)-/.test(id)

for (const [reviewId, added] of Object.entries(addedByReview)) {
  const proposed = proposedByReview[reviewId] ?? new Set()
  for (const id of added) {
    if (!isModelEntity(id)) continue
    if (!proposed.has(id)) semantic.push(`${reviewId} adds ${id} but no object has that proposalId`)
  }
  for (const id of proposed) {
    if (!added.has(id)) semantic.push(`${id} has proposalId ${reviewId} but is not an added change on that review`)
  }
}

const proposedIds = new Set(
  objectsWithField(modelText, 'proposedInVersion')
    .filter((item) => item.value === 'v19')
    .map((item) => item.id),
)

for (const [, id, target] of modelText.matchAll(/t\('(TM-\d+)', '[^']+', '[^']+', '(CMP-\d+)'/g)) {
  if (!proposedIds.has(id) && proposedIds.has(target)) {
    semantic.push(`${id} is approved but targets proposed ${target}`)
  }
}

for (const match of modelText.matchAll(/c\('(CTRL-\d+)',[\s\S]{0,180}\[([^\]]*)\]/g)) {
  const after = modelText.slice(match.index, match.index + 360)
  const proposedControl = after.includes("proposedInVersion: 'v19'")
  if (proposedControl) continue
  for (const target of match[2].match(/CMP-\d+/g) ?? []) {
    if (proposedIds.has(target)) semantic.push(`${match[1]} is approved but lists proposed ${target}`)
  }
}

const flowChunks = modelText.split(/id: '(DF-\d+)'/)
for (let i = 1; i < flowChunks.length; i += 2) {
  const body = flowChunks[i + 1].slice(0, 500)
  if (body.includes("proposedInVersion: 'v19'")) continue
  const from = body.match(/from: '(CMP-\d+)'/)?.[1]
  const to = body.match(/to: '(CMP-\d+)'/)?.[1]
  if (proposedIds.has(from)) semantic.push(`${flowChunks[i]} is approved but from proposed ${from}`)
  if (proposedIds.has(to)) semantic.push(`${flowChunks[i]} is approved but to proposed ${to}`)
}

const pathChunks = modelText.split(/id: '(AP-\d+)'/)
for (let i = 1; i < pathChunks.length; i += 2) {
  const body = pathChunks[i + 1].slice(0, 2500)
  if (body.includes("proposedInVersion: 'v19'")) continue
  for (const entity of body.match(/entityId: '(CMP-\d+)'/g) ?? []) {
    const id = entity.match(/CMP-\d+/)[0]
    if (proposedIds.has(id)) semantic.push(`${pathChunks[i]} is approved but walks proposed ${id}`)
  }
}

if (semantic.length) {
  console.error(`Semantic model issues (${semantic.length}):`)
  for (const line of semantic) console.error(`  ${line}`)
  process.exit(1)
}

console.log('Proposal contents and v18 references are consistent.')

