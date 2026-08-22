/* Canned assistant answers. Every answer ends in sources — the assistant is
   only allowed to claim what the model can trace back to evidence.
   [[ID]] tokens in text are rendered as clickable entity references. */

export type AssistantBlock =
  | { kind: 'text'; text: string }
  | { kind: 'ordered'; items: string[] }
  | { kind: 'findings'; ids: string[] }
  | { kind: 'path'; attackPathId: string }
  | { kind: 'sources'; refs: string[] }
  | { kind: 'action'; label: string; to: string }

export interface AssistantAnswer {
  id: string
  question: string
  blocks: AssistantBlock[]
}

export const SUGGESTED_PROMPTS = [
  'What is waiting for my review?',
  'Why does Pistachio believe FIND-107?',
  'What changed between v17 and v18?',
  'Which findings are based on PR #182?',
  'Show unverified assumptions.',
  'Which attack paths changed this week?',
]

export const ASSISTANT_ANSWERS: AssistantAnswer[] = [
  {
    id: 'ANS-01',
    question: 'What is waiting for my review?',
    blocks: [
      {
        kind: 'text',
        text: 'Seven items are waiting on a human. Agents proposed them; none of them changed the approved model.',
      },
      {
        kind: 'ordered',
        items: [
          '3 model changes — [[REV-021]] from PR #182 is the one that would publish v19.',
          '2 findings — [[FIND-107]] and [[FIND-109]] on the proposed webhook.',
          '1 risk decision — [[EXC-023]] for long-lived service credentials.',
          '1 contradicted assumption — [[ASM-012]] against terraform/prod/sqs.tf.',
        ],
      },
      { kind: 'action', label: 'Review PR #182 proposal', to: '/overview?review=REV-021' },
      { kind: 'sources', refs: ['REV-021', 'EV-041', 'FIND-107', 'ASM-012'] },
    ],
  },
  {
    id: 'ANS-02',
    question: 'Why does Pistachio believe FIND-107?',
    blocks: [
      {
        kind: 'text',
        text: 'Because a public webhook was proposed in [[EV-041]] and the handler has no replay window. Confidence is high — three sources agree and none conflict.',
      },
      {
        kind: 'ordered',
        items: [
          '[[EV-041]] PR #182 adds POST /webhooks/acquirer behind the public API gateway.',
          'The route is modelled as [[CMP-04]] and crosses [[TB-01]] on [[DF-02]].',
          '[[TM-041]] records the replay attack: HMAC is checked, nonce and timestamp are not.',
          'That produces [[FIND-107]] Missing replay protection, still in review.',
        ],
      },
      { kind: 'findings', ids: ['FIND-107'] },
      { kind: 'action', label: 'Open FIND-107', to: '/findings?id=FIND-107' },
      { kind: 'sources', refs: ['EV-041', 'CMP-04', 'TM-041', 'FIND-107'] },
    ],
  },
  {
    id: 'ANS-03',
    question: 'What changed between v17 and v18?',
    blocks: [
      {
        kind: 'text',
        text: 'v18 is the current approved model. Dana Okoye published it after reconciling architecture-v4.drawio. PR #182 is not in v18 — it is a pending proposal for v19.',
      },
      {
        kind: 'ordered',
        items: [
          'Architecture: Event Worker egress was documented against worker.tf.',
          'Threats: +3 / −1.',
          'Controls: +2.',
          'Findings: 2 resolved, 3 new.',
          'Risk posture stayed Medium → Medium.',
        ],
      },
      { kind: 'action', label: 'Compare v17 and v18', to: '/model?view=changes&compare=v17' },
      { kind: 'sources', refs: ['EV-039', 'EV-040'] },
    ],
  },
  {
    id: 'ANS-04',
    question: 'Which findings are based on PR #182?',
    blocks: [
      {
        kind: 'text',
        text: 'Two findings were proposed from [[EV-041]]. They are not authoritative model state; they wait with [[REV-021]].',
      },
      { kind: 'findings', ids: ['FIND-107', 'FIND-109'] },
      {
        kind: 'text',
        text: 'Source: PR #182. Proposed threats are [[TM-041]] Replay attack and [[TM-048]] Forged webhook event.',
      },
      { kind: 'action', label: 'View model changes', to: '/model?view=changes' },
      { kind: 'sources', refs: ['EV-041', 'FIND-107', 'FIND-109'] },
    ],
  },
  {
    id: 'ANS-05',
    question: 'Show unverified assumptions.',
    blocks: [
      { kind: 'text', text: 'Three assumptions are unverified. One additional assumption is contradicted by later evidence.' },
      {
        kind: 'ordered',
        items: [
          '[[ASM-01]] — merchant bearer tokens never leave the merchant server. No evidence either way; [[TM-014]] depends on it.',
          '[[ASM-05]] — the acquirer will not re-send a delivered event. Entered from the Aug 22 sync; [[TM-041]] depends on it.',
          '[[ASM-06]] — customer records at rest use a customer-managed key. Tracked as [[FIND-098]].',
        ],
      },
      {
        kind: 'text',
        text: '[[ASM-012]] is contradicted, not unverified: the Aug 20 sync said the queue accepts only approved producers, and [[EV-044]] terraform/prod/sqs.tf grants a wildcard. That produced [[FIND-112]].',
      },
      { kind: 'action', label: 'Open ASM-012 review', to: '/overview?review=REV-027' },
      { kind: 'sources', refs: ['EV-040', 'EV-044', 'EV-045', 'ASM-012'] },
    ],
  },
  {
    id: 'ANS-06',
    question: 'Which attack paths changed this week?',
    blocks: [
      {
        kind: 'text',
        text: 'Two paths moved. [[AP-03]] is a proposed webhook-replay path attached to PR #182 — it is not in the approved v18 graph until REV-021 is accepted. [[AP-021]] was opened when [[ASM-012]] was contradicted.',
      },
      { kind: 'path', attackPathId: 'AP-03' },
      { kind: 'findings', ids: ['FIND-107', 'FIND-112'] },
      { kind: 'action', label: 'Open attack paths', to: '/model?view=paths&path=AP-03' },
      { kind: 'sources', refs: ['EV-041', 'EV-044', 'AP-03', 'AP-021'] },
    ],
  },
  {
    id: 'ANS-07',
    question: 'What changed in the threat model today?',
    blocks: [
      {
        kind: 'text',
        text: 'The approved model is still v18. What changed today is a proposal, not a publication.',
      },
      {
        kind: 'ordered',
        items: [
          '[[EV-041]] PR #182 introduced POST /webhooks/acquirer.',
          'PR Review Agent proposed [[CMP-04]] and two data flows.',
          'Threat Analysis proposed [[TM-041]], [[TM-048]], [[FIND-107]] and [[FIND-109]].',
          '[[REV-021]] is waiting for a human. Approval would publish v19 and raise posture Medium → High.',
        ],
      },
      { kind: 'findings', ids: ['FIND-107', 'FIND-109'] },
      { kind: 'action', label: 'Review proposed changes', to: '/overview?review=REV-021' },
      { kind: 'sources', refs: ['EV-041', 'REV-021', 'FIND-107'] },
    ],
  },
  {
    id: 'ANS-08',
    question: 'Show attack paths to customer PII',
    blocks: [
      {
        kind: 'text',
        text: 'One modelled path reaches [[AST-01]] Customer PII. It is partially mitigated — the audit trail records the access, but nothing stops it.',
      },
      { kind: 'path', attackPathId: 'AP-01' },
      {
        kind: 'text',
        text: 'The weak step is the fourth: a single database service account carries bulk SELECT on customer tables and is used by three workloads. That is tracked as [[FIND-102]].',
      },
      { kind: 'findings', ids: ['FIND-102', 'FIND-096'] },
      { kind: 'sources', refs: ['EV-042', 'EV-039', 'FIND-102'] },
    ],
  },
  {
    id: 'ANS-09',
    question: 'Why is FIND-103 critical?',
    blocks: [
      {
        kind: 'text',
        text: 'Because a phishable step-up guards a route that can move money, and no compensating control covers it.',
      },
      {
        kind: 'ordered',
        items: [
          '[[EV-030]] SEC-IAM-22 requires phishing-resistant authentication for any interface that can alter money movement.',
          'The /admin/payment-config route on [[CMP-03]] accepts an OTP challenge, which a real-time relay defeats.',
          'Payment configuration takes effect on the next authorization with no deploy and no second approval.',
          '[[EXC-021]] accepts this risk for the legacy admin console only. Its scope does not extend to this route.',
        ],
      },
      { kind: 'path', attackPathId: 'AP-02' },
      { kind: 'sources', refs: ['EV-030', 'EV-039', 'EV-040'] },
    ],
  },
  {
    id: 'ANS-10',
    question: 'What evidence supports TM-014?',
    blocks: [
      {
        kind: 'text',
        text: '[[TM-014]] — token theft enables unauthorized payment requests — rests on three sources.',
      },
      {
        kind: 'ordered',
        items: [
          '[[EV-034]] the API specification documents OAuth2 client-credential authentication with no sender constraint.',
          '[[EV-039]] the architecture diagram places the token on every hop between the gateway and the Payment API.',
          '[[EV-042]] runtime telemetry shows tokens accepted from networks outside the merchant allowlist.',
        ],
      },
      { kind: 'findings', ids: ['FIND-096'] },
      { kind: 'sources', refs: ['EV-034', 'EV-039', 'EV-042'] },
    ],
  },
]

export const ASSISTANT_FALLBACK: AssistantBlock[] = [
  {
    kind: 'text',
    text: 'This demo answers from the current model and the pending reviews. Ask why a finding exists, what changed between versions, or what is waiting for review — I will name the objects I used.',
  },
]
