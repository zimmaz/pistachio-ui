/* Canned assistant answers. Every answer ends in sources — the assistant is
   only allowed to claim what the model can trace back to evidence.
   [[ID]] tokens in text are rendered as clickable entity references. */

export type AssistantBlock =
  | { kind: 'text'; text: string }
  | { kind: 'ordered'; items: string[] }
  | { kind: 'findings'; ids: string[] }
  | { kind: 'path'; attackPathId: string }
  | { kind: 'sources'; refs: string[] }

export interface AssistantAnswer {
  id: string
  question: string
  blocks: AssistantBlock[]
}

export const SUGGESTED_PROMPTS = [
  'What changed in the threat model today?',
  'Show attack paths to customer PII',
  'Why is FIND-103 critical?',
  'Which assumptions remain unverified?',
  'What evidence supports TM-014?',
]

export const ASSISTANT_ANSWERS: AssistantAnswer[] = [
  {
    id: 'ANS-01',
    question: 'What changed in the threat model today?',
    blocks: [
      { kind: 'text', text: 'Three security-relevant changes were identified today.' },
      {
        kind: 'ordered',
        items: [
          'A new public payment webhook was introduced by [[EV-041]] and modelled as [[CMP-04]].',
          'The webhook creates a third Internet → Production crossing on [[TB-01]], carried by data flow [[DF-02]].',
          'Two findings were created and neither has a recorded decision yet.',
        ],
      },
      { kind: 'findings', ids: ['FIND-103', 'FIND-107'] },
      {
        kind: 'text',
        text: 'The model moved from v17 to v18 at 12:07, published by the Architecture Agent after the Threat Analysis Agent validated the affected subgraph.',
      },
      { kind: 'sources', refs: ['EV-041', 'EV-039', 'FIND-103', 'FIND-107'] },
    ],
  },
  {
    id: 'ANS-02',
    question: 'What changed this week?',
    blocks: [
      {
        kind: 'text',
        text: 'Five model versions were published this week, from v14 to v18. The structural changes worth your attention:',
      },
      {
        kind: 'ordered',
        items: [
          '[[CMP-04]] Webhook Service entered the model and became the third crossing of [[TB-01]].',
          '[[ASM-03]] was contradicted by runtime evidence — one database service account is shared by three workloads.',
          'The edge TLS policy moved to 1.3 and the egress allowlist narrowed to four CIDRs, recorded from [[EV-038]].',
          'Two assumptions entered from the Aug 22 architecture sync and remain unconfirmed.',
        ],
      },
      {
        kind: 'text',
        text: 'Net effect on posture: the Payment API residual risk rose from Medium to High, and open findings went from 9 to 12.',
      },
      { kind: 'sources', refs: ['EV-041', 'EV-040', 'EV-038', 'EV-042'] },
    ],
  },
  {
    id: 'ANS-03',
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
    id: 'ANS-04',
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
          'Payment configuration takes effect on the next authorization with no deploy and no second approval, so impact is immediate.',
          '[[EXC-021]] accepts this risk for the legacy admin console only. Its scope does not extend to this route.',
        ],
      },
      { kind: 'path', attackPathId: 'AP-02' },
      { kind: 'sources', refs: ['EV-030', 'EV-039', 'EV-040', 'EV-041'] },
    ],
  },
  {
    id: 'ANS-05',
    question: 'Which assumptions remain unverified?',
    blocks: [
      { kind: 'text', text: 'Three assumptions are unverified and two are contradicted by evidence.' },
      {
        kind: 'ordered',
        items: [
          '[[ASM-01]] — merchant bearer tokens never leave the merchant server environment. No evidence either way; [[TM-014]] depends on it.',
          '[[ASM-05]] — the acquirer will not re-send a delivered event. Entered from the Aug 22 sync; [[TM-041]] depends on it.',
          '[[ASM-06]] — customer records at rest use a customer-managed key. Entered from the same sync and tracked as [[FIND-098]].',
        ],
      },
      {
        kind: 'text',
        text: 'The two contradicted ones are [[ASM-02]] on phishing-resistant enrolment and [[ASM-03]] on per-workload service accounts. Both already have findings attached.',
      },
      { kind: 'sources', refs: ['EV-040', 'EV-042', 'EV-034'] },
    ],
  },
  {
    id: 'ANS-06',
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
      {
        kind: 'text',
        text: 'Residual risk is High rather than Critical because [[CTRL-26]] anomaly detection reliably catches volume abuse. It does not catch a single fraudulent authorization.',
      },
      { kind: 'findings', ids: ['FIND-096'] },
      { kind: 'sources', refs: ['EV-034', 'EV-039', 'EV-042'] },
    ],
  },
]

export const ASSISTANT_FALLBACK: AssistantBlock[] = [
  {
    kind: 'text',
    text: 'This demo answers from a fixed set of questions against model v18. Pick one of the suggestions below and I will trace the answer back to its evidence.',
  },
]
