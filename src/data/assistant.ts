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

export type AssistantPhase = 'pre' | 'post' | 'any'

export interface AssistantAnswer {
  id: string
  question: string
  aliases?: string[]
  phase?: AssistantPhase
  blocks: AssistantBlock[]
}

export const SUGGESTED_PROMPTS = [
  'What is waiting for my review?',
  'Is the webhook part of the current model?',
  'What changed in PR #182?',
  'Why does Pistachio believe FIND-112?',
  'Was PR #182 approved?',
  'Which assumptions are contradicted?',
]

export const ASSISTANT_ANSWERS: AssistantAnswer[] = [
  {
    id: 'ANS-01a',
    question: 'What is waiting for my review?',
    phase: 'pre',
    blocks: [
      {
        kind: 'text',
        text: 'Five items are in the review queue. Agents proposed them; none of them changed the approved model by themselves.',
      },
      {
        kind: 'ordered',
        items: [
          '2 model changes — [[REV-021]] from PR #182 is the one that would publish v19.',
          '1 finding — [[FIND-107]] remains a separate operational review.',
          '1 risk decision — [[EXC-023]] for long-lived service credentials.',
          '1 contradicted assumption — [[ASM-012]] against terraform/prod/sqs.tf.',
        ],
      },
      { kind: 'action', label: 'Review PR #182 proposal', to: '/overview?review=REV-021' },
      { kind: 'sources', refs: ['REV-021', 'EV-041', 'FIND-107', 'ASM-012'] },
    ],
  },
  {
    id: 'ANS-01b',
    question: 'What is waiting for my review?',
    phase: 'post',
    blocks: [
      {
        kind: 'text',
        text: '[[REV-021]] is approved. Four items remain in the queue. They do not republish the model.',
      },
      {
        kind: 'ordered',
        items: [
          '1 model change — [[REV-023]] Event Worker egress still disagrees with the diagram.',
          '1 finding — [[FIND-107]] Missing replay protection is still In Review.',
          '1 risk decision — [[EXC-023]] for long-lived service credentials.',
          '1 contradicted assumption — [[ASM-012]] against terraform/prod/sqs.tf.',
        ],
      },
      { kind: 'action', label: 'Open the review queue', to: '/overview' },
      { kind: 'sources', refs: ['REV-023', 'FIND-107', 'EXC-023', 'ASM-012'] },
    ],
  },
  {
    id: 'ANS-02',
    question: 'Why does Pistachio believe FIND-107?',
    aliases: ['Why does Pistachio believe FIND-107'],
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
          '[[TM-047]] records the replay attack: HMAC is checked, nonce and timestamp are not.',
          'That produces [[FIND-107]] Missing replay protection, still in review. Approving the model does not close it.',
        ],
      },
      { kind: 'findings', ids: ['FIND-107'] },
      { kind: 'action', label: 'Open FIND-107', to: '/findings?id=FIND-107' },
      { kind: 'sources', refs: ['EV-041', 'CMP-04', 'TM-047', 'FIND-107'] },
    ],
  },
  {
    id: 'ANS-03',
    question: 'What changed between v17 and v18?',
    blocks: [
      {
        kind: 'text',
        text: 'v18 is an approved version. Dana Okoye published it after reconciling architecture-v4.drawio. PR #182 is not in that comparison — it is the v19 proposal.',
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
    id: 'ANS-04a',
    question: 'Which findings came from PR #182?',
    aliases: ['Which findings are based on PR #182?', 'Which findings are based on PR #182'],
    blocks: [
      {
        kind: 'text',
        text: 'Two findings were proposed from [[EV-041]]. They are operational objects. Approving the model does not resolve them.',
      },
      { kind: 'findings', ids: ['FIND-107', 'FIND-109'] },
      {
        kind: 'text',
        text: 'Related threats are [[TM-047]] Replay attack and [[TM-048]] Forged webhook event. [[FIND-107]] is In Review. [[FIND-109]] is Open.',
      },
      { kind: 'action', label: 'Open findings from PR #182', to: '/findings?id=FIND-107' },
      { kind: 'sources', refs: ['EV-041', 'FIND-107', 'FIND-109'] },
    ],
  },
  {
    id: 'ANS-05',
    question: 'Show unverified assumptions.',
    aliases: ['Which assumptions are contradicted?', 'Which assumptions are contradicted'],
    blocks: [
      { kind: 'text', text: 'Three assumptions are unverified. One additional assumption is contradicted by later evidence.' },
      {
        kind: 'ordered',
        items: [
          '[[ASM-01]] — merchant bearer tokens never leave the merchant server. No evidence either way; [[TM-014]] depends on it.',
          '[[ASM-05]] — the acquirer will not re-send a delivered event. Entered from the Aug 22 sync; [[TM-047]] depends on it.',
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
        text: 'Two paths moved. [[AP-03]] is the webhook-replay path attached to PR #182. [[AP-021]] was opened when [[ASM-012]] was contradicted.',
      },
      { kind: 'path', attackPathId: 'AP-03' },
      { kind: 'findings', ids: ['FIND-107', 'FIND-112'] },
      { kind: 'action', label: 'Open attack paths', to: '/model?view=paths&path=AP-03' },
      { kind: 'sources', refs: ['EV-041', 'EV-044', 'AP-03', 'AP-021'] },
    ],
  },
  {
    id: 'ANS-07a',
    question: 'What changed in PR #182?',
    aliases: ['What changed in the threat model today?'],
    phase: 'pre',
    blocks: [
      {
        kind: 'text',
        text: 'Pistachio has proposed these changes. They are awaiting review and are not yet part of the authoritative model.',
      },
      {
        kind: 'ordered',
        items: [
          '[[CMP-04]] Webhook Service',
          '2 new data flows: Internet → Webhook Service, Webhook Service → Event Queue',
          '[[TM-047]] Replay attack and [[TM-048]] Forged webhook event',
          '[[TB-01]] crossing updated',
        ],
      },
      {
        kind: 'text',
        text: '[[REV-021]] must be approved before these objects belong to v19. Related findings [[FIND-107]] and [[FIND-109]] stay open either way.',
      },
      { kind: 'findings', ids: ['FIND-107', 'FIND-109'] },
      { kind: 'action', label: 'Review proposed changes', to: '/overview?review=REV-021' },
      { kind: 'sources', refs: ['EV-041', 'REV-021', 'CMP-04', 'TM-047'] },
    ],
  },
  {
    id: 'ANS-07b',
    question: 'What changed in PR #182?',
    aliases: ['What changed in the threat model today?'],
    phase: 'post',
    blocks: [
      {
        kind: 'text',
        text: 'PR #182 was approved into model v19.',
      },
      {
        kind: 'ordered',
        items: [
          '[[CMP-04]] Webhook Service',
          '2 data flows across [[TB-01]]',
          '[[TM-047]] Replay attack',
          '[[TM-048]] Forged webhook event',
        ],
      },
      {
        kind: 'text',
        text: 'The related findings remain open. [[FIND-107]] is In Review. [[FIND-109]] is Open.',
      },
      { kind: 'findings', ids: ['FIND-107', 'FIND-109'] },
      { kind: 'action', label: 'Open model v19', to: '/model?view=changes' },
      { kind: 'sources', refs: ['EV-041', 'REV-021', 'CMP-04', 'TM-047'] },
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
  {
    id: 'ANS-11a',
    question: 'Is the webhook part of the current model?',
    aliases: ['Is the webhook part of the current model'],
    phase: 'pre',
    blocks: [
      {
        kind: 'text',
        text: 'No. The Webhook Service is proposed for v19 and is awaiting human review.',
      },
      {
        kind: 'text',
        text: '[[CMP-04]] appears only when proposed changes are shown. The authoritative model is still v18. [[REV-021]] is the review that would publish it.',
      },
      { kind: 'action', label: 'Review REV-021', to: '/overview?review=REV-021' },
      { kind: 'sources', refs: ['CMP-04', 'REV-021', 'EV-041'] },
    ],
  },
  {
    id: 'ANS-11b',
    question: 'Is the webhook part of the current model?',
    aliases: ['Is the webhook part of the current model'],
    phase: 'post',
    blocks: [
      {
        kind: 'text',
        text: 'Yes. The Webhook Service was approved into model v19 through [[REV-021]].',
      },
      {
        kind: 'text',
        text: '[[CMP-04]], the two webhook data flows, [[TM-047]] and [[TM-048]] are now authoritative. [[FIND-107]] and [[FIND-109]] remain open findings.',
      },
      { kind: 'action', label: 'Open the current model', to: '/model?view=architecture' },
      { kind: 'sources', refs: ['CMP-04', 'REV-021', 'TM-047'] },
    ],
  },
  {
    id: 'ANS-12a',
    question: 'What is currently authoritative?',
    aliases: ['What is currently authoritative'],
    phase: 'pre',
    blocks: [
      {
        kind: 'text',
        text: 'Model v18 is authoritative. It was published by Dana Okoye after the architecture-v4.drawio reconciliation.',
      },
      {
        kind: 'text',
        text: 'PR #182 objects — Webhook Service, the two new flows, [[TM-047]] and [[TM-048]] — are proposed for v19 and are not part of the current model.',
      },
      { kind: 'action', label: 'Open the current model', to: '/model?view=document' },
      { kind: 'sources', refs: ['EV-039', 'REV-021'] },
    ],
  },
  {
    id: 'ANS-12b',
    question: 'What is currently authoritative?',
    aliases: ['What is currently authoritative'],
    phase: 'post',
    blocks: [
      {
        kind: 'text',
        text: 'Model v19 is authoritative. It was published just now when [[REV-021]] was approved.',
      },
      {
        kind: 'text',
        text: 'v19 includes the Webhook Service, the two webhook flows, [[TM-047]] and [[TM-048]]. Findings remain separate operational objects.',
      },
      { kind: 'action', label: 'Open model history', to: '/model?view=changes' },
      { kind: 'sources', refs: ['REV-021', 'CMP-04', 'TM-047'] },
    ],
  },
  {
    id: 'ANS-13a',
    question: 'What changed between v18 and v19?',
    aliases: ['What changed between v18 and v19'],
    phase: 'pre',
    blocks: [
      {
        kind: 'text',
        text: 'v19 does not exist yet. The current comparison is v18 → proposed v19 from [[REV-021]].',
      },
      {
        kind: 'ordered',
        items: [
          '+ Webhook Service',
          '+ Internet → Webhook Service',
          '+ Webhook Service → Event Queue',
          '~ TB-01 changed',
          '+ TM-047 Replay attack',
          '+ TM-048 Forged webhook event',
        ],
      },
      { kind: 'action', label: 'Review the proposal', to: '/overview?review=REV-021' },
      { kind: 'sources', refs: ['REV-021', 'EV-041'] },
    ],
  },
  {
    id: 'ANS-13b',
    question: 'What changed between v18 and v19?',
    aliases: ['What changed between v18 and v19'],
    phase: 'post',
    blocks: [
      {
        kind: 'text',
        text: 'v19 is current. The approved delta from v18 is the PR #182 webhook subgraph.',
      },
      {
        kind: 'ordered',
        items: [
          '+ Webhook Service',
          '+ 2 data flows',
          '~ TB-01',
          '+ TM-047 and TM-048',
        ],
      },
      {
        kind: 'text',
        text: 'Findings were not decided by that approval. [[FIND-107]] and [[FIND-109]] remain open.',
      },
      { kind: 'action', label: 'Open model changes', to: '/model?view=changes' },
      { kind: 'sources', refs: ['REV-021', 'CMP-04', 'TM-047'] },
    ],
  },
  {
    id: 'ANS-14',
    question: 'Why does Pistachio believe FIND-112?',
    aliases: ['Why does Pistachio believe FIND-112'],
    blocks: [
      {
        kind: 'text',
        text: 'Because later infrastructure evidence contradicts an earlier architecture assumption. The finding is supported by terraform; it does not cause the attack path.',
      },
      {
        kind: 'ordered',
        items: [
          '[[EV-045]] Architecture Sync established [[ASM-012]] — the queue accepts only approved producers.',
          '[[EV-044]] terraform/prod/sqs.tf contradicts [[ASM-012]] with a wildcard producer permission.',
          'That affects [[TM-049]], which participates in [[AP-021]].',
          'The same terraform file supports [[FIND-112]].',
        ],
      },
      { kind: 'findings', ids: ['FIND-112'] },
      { kind: 'action', label: 'Open FIND-112 provenance', to: '/findings?id=FIND-112' },
      { kind: 'sources', refs: ['EV-044', 'EV-045', 'ASM-012', 'FIND-112'] },
    ],
  },
  {
    id: 'ANS-15a',
    question: 'Was PR #182 approved?',
    aliases: ['Was PR #182 approved'],
    phase: 'pre',
    blocks: [
      {
        kind: 'text',
        text: 'No. PR #182 is still a proposal. [[REV-021]] is awaiting human review and has not published v19.',
      },
      { kind: 'action', label: 'Review REV-021', to: '/overview?review=REV-021' },
      { kind: 'sources', refs: ['REV-021', 'EV-041'] },
    ],
  },
  {
    id: 'ANS-15b',
    question: 'Was PR #182 approved?',
    aliases: ['Was PR #182 approved'],
    phase: 'post',
    blocks: [
      {
        kind: 'text',
        text: 'Yes. [[REV-021]] was approved by Dana Okoye, Security Architect. That published model v19.',
      },
      {
        kind: 'text',
        text: 'The related findings were not closed by that approval.',
      },
      { kind: 'findings', ids: ['FIND-107', 'FIND-109'] },
      { kind: 'sources', refs: ['REV-021', 'EV-041'] },
    ],
  },
  {
    id: 'ANS-16',
    question: 'Which risks have been accepted?',
    aliases: ['Which risks have been accepted'],
    blocks: [
      {
        kind: 'text',
        text: 'Two accepted exceptions are on the current model. A third is requested and has no security approval yet.',
      },
      {
        kind: 'ordered',
        items: [
          '[[EXC-021]] — OTP step-up on the legacy admin console. Approved by AppSec Director. Risk owner Payments Director. Expires 30 Nov 2026.',
          '[[EXC-019]] — platform-managed queue encryption. Approved by AppSec Director. Expires 28 Aug 2026.',
          '[[EXC-023]] — long-lived service credentials on [[FIND-096]]. Requested. Required approver AppSec Director.',
        ],
      },
      { kind: 'action', label: 'Open accepted risks', to: '/model?view=document#risks' },
      { kind: 'sources', refs: ['EXC-021', 'EXC-019', 'EXC-023', 'FIND-096'] },
    ],
  },
]

export const ASSISTANT_FALLBACK: AssistantBlock[] = [
  {
    kind: 'text',
    text: 'This demo answers from the current model and the pending reviews. Ask what is authoritative, what changed in PR #182, or why a finding exists — I will name the objects I used.',
  },
]

export function answerFor(question: string, webhookApproved: boolean): AssistantBlock[] {
  const needle = question.trim().toLowerCase()
  const phase: AssistantPhase = webhookApproved ? 'post' : 'pre'
  const eligible = ASSISTANT_ANSWERS.filter((answer) => !answer.phase || answer.phase === phase || answer.phase === 'any')

  const matches = (answer: AssistantAnswer) => {
    const titles = [answer.question, ...(answer.aliases ?? [])].map((value) => value.toLowerCase().replace(/\?+$/, ''))
    return titles.includes(needle.replace(/\?+$/, '')) || titles.includes(needle)
  }

  const exact = eligible.find(matches)
  if (exact) return exact.blocks

  const scored = eligible.map((answer) => {
    const words = needle.split(/\s+/).filter((word) => word.length > 3)
    const target = [answer.question, ...(answer.aliases ?? [])].join(' ').toLowerCase()
    const hits = words.filter((word) => target.includes(word)).length
    return { answer, hits }
  }).sort((a, b) => b.hits - a.hits)

  if (scored[0] && scored[0].hits >= 2) return scored[0].answer.blocks
  return ASSISTANT_FALLBACK
}
