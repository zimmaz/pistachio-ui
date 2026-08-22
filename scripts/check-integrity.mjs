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
