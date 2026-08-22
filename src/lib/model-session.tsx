import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { MODEL_ACTIVITY, NOTIFICATIONS } from '@/data/activity'
import { MODEL_VERSIONS, PROPOSED_VERSION } from '@/data/project'
import { REVIEWS } from '@/data/reviews'
import type {
  ActivityEvent,
  FindingDecision,
  FindingStatus,
  ModelVersion,
  Notification,
  Review,
  ReviewClarification,
  ReviewRevisionState,
  ReviewStatus,
} from '@/data/types'

export interface AcceptedRiskRecord {
  riskOwner: string
  securityApprover: string
  justification: string
  compensatingControls: string[]
  expires: string
  reviewDate: string
  status: 'Requested' | 'Approved' | 'Rejected'
}

interface ReviewRuntime {
  status: ReviewStatus
  revision: ReviewRevisionState
  note?: string
  clarification?: ReviewClarification
}

interface ModelSessionValue {
  currentVersion: string
  webhookApproved: boolean
  pendingProposalCount: number
  lastApprovedLabel: string
  modelHistory: ModelVersion[]
  reviewStatus: (id: string) => ReviewStatus
  reviewRevision: (id: string) => ReviewRevisionState
  reviewClarification: (id: string) => ReviewClarification | undefined
  pendingReviews: Review[]
  clarificationReviews: Review[]
  liveReviews: Review[]
  decideReview: (id: string, status: ReviewStatus, note?: string) => void
  editReview: (id: string) => void
  requestClarification: (id: string, question?: string) => void
  returnToReview: (id: string) => void
  reviewNote: (id: string) => string | undefined
  findingDecision: (id: string) => FindingDecision | undefined
  recordFinding: (id: string, decision: FindingDecision) => void
  acceptedRisk: (id: string) => AcceptedRiskRecord | undefined
  requestRiskAcceptance: (id: string, record: AcceptedRiskRecord) => void
  approveRiskAcceptance: (id: string) => void
  rejectRiskAcceptance: (id: string) => void
  activity: ActivityEvent[]
  notifications: Notification[]
}

const DEFAULT_CLARIFICATION: ReviewClarification = {
  question: 'Is replay protection implemented upstream of the webhook handler?',
  requestedFrom: 'PR Review Agent',
  requestedBy: 'Dana Okoye',
}

const ModelSessionContext = createContext<ModelSessionValue | null>(null)

export function ModelSessionProvider({ children }: { children: ReactNode }) {
  const [reviewRuntime, setReviewRuntime] = useState<Record<string, ReviewRuntime>>({})
  const [findingDecisions, setFindingDecisions] = useState<Record<string, FindingDecision>>({})
  const [acceptedRisks, setAcceptedRisks] = useState<Record<string, AcceptedRiskRecord>>({})

  const reviewStatus = useCallback(
    (id: string): ReviewStatus =>
      reviewRuntime[id]?.status ?? REVIEWS.find((review) => review.id === id)?.status ?? 'Awaiting Review',
    [reviewRuntime],
  )

  const reviewRevision = useCallback(
    (id: string): ReviewRevisionState =>
      reviewRuntime[id]?.revision ?? REVIEWS.find((review) => review.id === id)?.revision ?? 'original',
    [reviewRuntime],
  )

  const reviewClarification = useCallback(
    (id: string) => reviewRuntime[id]?.clarification ?? REVIEWS.find((review) => review.id === id)?.clarification,
    [reviewRuntime],
  )

  const webhookApproved = reviewStatus('REV-021') === 'Approved'
  const currentVersion = webhookApproved ? 'v19' : 'v18'

  const liveReviews = useMemo(
    () =>
      REVIEWS.filter((review) => {
        const status = reviewRuntime[review.id]?.status ?? review.status
        return status === 'Awaiting Review' || status === 'Awaiting Clarification'
      }).map((review) => ({
        ...review,
        status: reviewRuntime[review.id]?.status ?? review.status,
        revision: reviewRuntime[review.id]?.revision ?? review.revision,
      })),
    [reviewRuntime],
  )

  const pendingReviews = liveReviews.filter((review) => review.status === 'Awaiting Review')
  const clarificationReviews = liveReviews.filter((review) => review.status === 'Awaiting Clarification')
  const pendingProposalCount = liveReviews.filter((review) => Boolean(review.producesVersion)).length

  const patchReview = useCallback((id: string, next: Partial<ReviewRuntime>) => {
    setReviewRuntime((prev) => {
      const current = prev[id] ?? {
        status: REVIEWS.find((review) => review.id === id)?.status ?? 'Awaiting Review',
        revision: REVIEWS.find((review) => review.id === id)?.revision ?? 'original',
      }
      return { ...prev, [id]: { ...current, ...next } }
    })
  }, [])

  const decideReview = useCallback(
    (id: string, status: ReviewStatus, note?: string) => {
      patchReview(id, { status, note })
      if (id === 'REV-026' && status === 'Approved') {
        setFindingDecisions((prev) => ({
          ...prev,
          'FIND-096': {
            status: 'Risk Accepted',
            note: 'Risk accepted by Payments Director. Approved by AppSec Director. Expires 31 Oct 2026.',
          },
        }))
      }
    },
    [patchReview],
  )

  const editReview = useCallback(
    (id: string) => {
      patchReview(id, {
        status: 'Awaiting Review',
        revision: 'edited',
        note: 'Edited by Dana Okoye. The proposal remains awaiting review.',
      })
    },
    [patchReview],
  )

  const requestClarification = useCallback(
    (id: string, question?: string) => {
      const review = REVIEWS.find((item) => item.id === id)
      patchReview(id, {
        status: 'Awaiting Clarification',
        clarification: {
          question: question ?? DEFAULT_CLARIFICATION.question,
          requestedFrom: review ? agentName(review.proposedByAgentId) : DEFAULT_CLARIFICATION.requestedFrom,
          requestedBy: 'Dana Okoye',
        },
        note: 'Clarification requested. The review stays open until it is returned to the queue.',
      })
    },
    [patchReview],
  )

  const returnToReview = useCallback(
    (id: string) => {
      patchReview(id, {
        status: 'Awaiting Review',
        note: 'Returned to review after clarification. Still awaiting a human decision.',
      })
    },
    [patchReview],
  )

  const recordFinding = useCallback((id: string, decision: FindingDecision) => {
    setFindingDecisions((prev) => ({ ...prev, [id]: decision }))
  }, [])

  const requestRiskAcceptance = useCallback((id: string, record: AcceptedRiskRecord) => {
    setAcceptedRisks((prev) => ({ ...prev, [id]: { ...record, status: 'Requested' } }))
    setFindingDecisions((prev) => ({
      ...prev,
      [id]: {
        status: 'Risk Acceptance Requested' as FindingStatus,
        note: `Risk acceptance requested. Owner ${record.riskOwner}. Required approver ${record.securityApprover}. Agents cannot accept this risk.`,
      },
    }))
  }, [])

  const approveRiskAcceptance = useCallback((id: string) => {
    setAcceptedRisks((prev) => {
      const current = prev[id]
      if (!current) return prev
      const approved = { ...current, status: 'Approved' as const }
      setFindingDecisions((decisions) => ({
        ...decisions,
        [id]: {
          status: 'Risk Accepted',
          note: `Risk accepted by ${approved.riskOwner}. Approved by ${approved.securityApprover}. Expires ${approved.expires}.`,
        },
      }))
      return { ...prev, [id]: approved }
    })
  }, [])

  const rejectRiskAcceptance = useCallback((id: string) => {
    setAcceptedRisks((prev) => {
      const current = prev[id]
      if (!current) return prev
      return { ...prev, [id]: { ...current, status: 'Rejected' } }
    })
    setFindingDecisions((prev) => ({
      ...prev,
      [id]: {
        status: 'Open',
        note: 'Risk acceptance rejected by AppSec Director. The finding remains open.',
      },
    }))
  }, [])

  const modelHistory = useMemo<ModelVersion[]>(() => {
    if (!webhookApproved) return MODEL_VERSIONS
    return [
      {
        ...PROPOSED_VERSION,
        status: 'Current',
        createdLabel: 'just now',
        publishedBy: 'Dana Okoye',
        trigger: 'REV-021 approved — PR #182',
      },
      { ...MODEL_VERSIONS[0], status: 'Historical' },
      ...MODEL_VERSIONS.slice(1),
    ]
  }, [webhookApproved])

  const activity = useMemo<ActivityEvent[]>(() => {
    const rest = MODEL_ACTIVITY.filter((event) => !(webhookApproved && event.id === 'ACT-01'))
    if (!webhookApproved) return MODEL_ACTIVITY
    return [
      {
        id: 'ACT-NOW',
        at: new Date().toISOString(),
        label: 'just now',
        text: 'REV-021 approved. Model v19 created. Approved by Dana Okoye, Security Architect.',
        kind: 'decision',
        verb: 'Approved',
        refs: [
          { label: 'REV-021', to: '/overview?review=REV-021' },
          { label: 'v19', to: '/model?view=changes' },
        ],
      },
      ...rest,
    ]
  }, [webhookApproved])

  const notifications = useMemo<Notification[]>(() => {
    const modelPending = liveReviews.filter((review) => review.type === 'Model Change').length
    return NOTIFICATIONS.flatMap((notification) => {
      if (notification.id === 'NTF-01') {
        if (modelPending === 0) return []
        return [
          {
            ...notification,
            text:
              modelPending === 1
                ? '1 proposed model change requires review'
                : `${modelPending} proposed model changes require review`,
            detail:
              webhookApproved
                ? 'REV-021 is approved. Remaining model-change reviews do not publish a new version.'
                : 'REV-021 from PR #182 is the highest impact. Approval would publish model v19.',
          },
        ]
      }
      if (notification.id === 'NTF-03') {
        return [
          {
            ...notification,
            text: 'Risk exception EXC-019 expires in 6 days',
            detail: 'EXC-019 covers queue encryption with a platform-managed key. It lapses on 28 Aug 2026.',
            actionLabel: 'Open EXC-019',
          },
        ]
      }
      return [notification]
    })
  }, [liveReviews, webhookApproved])

  const value = useMemo<ModelSessionValue>(
    () => ({
      currentVersion,
      webhookApproved,
      pendingProposalCount,
      lastApprovedLabel: webhookApproved ? 'just now' : '2 hours ago',
      modelHistory,
      reviewStatus,
      reviewRevision,
      reviewClarification,
      pendingReviews,
      clarificationReviews,
      liveReviews,
      decideReview,
      editReview,
      requestClarification,
      returnToReview,
      reviewNote: (id: string) => reviewRuntime[id]?.note,
      findingDecision: (id: string) => findingDecisions[id],
      recordFinding,
      acceptedRisk: (id: string) => acceptedRisks[id],
      requestRiskAcceptance,
      approveRiskAcceptance,
      rejectRiskAcceptance,
      activity,
      notifications,
    }),
    [
      acceptedRisks,
      activity,
      approveRiskAcceptance,
      clarificationReviews,
      currentVersion,
      decideReview,
      editReview,
      findingDecisions,
      liveReviews,
      modelHistory,
      notifications,
      pendingProposalCount,
      pendingReviews,
      recordFinding,
      rejectRiskAcceptance,
      requestClarification,
      requestRiskAcceptance,
      returnToReview,
      reviewClarification,
      reviewRevision,
      reviewRuntime,
      reviewStatus,
      webhookApproved,
    ],
  )

  return <ModelSessionContext.Provider value={value}>{children}</ModelSessionContext.Provider>
}

export function useModelSession() {
  const value = useContext(ModelSessionContext)
  if (!value) throw new Error('useModelSession must be used within ModelSessionProvider')
  return value
}

export function useOptionalModelSession() {
  return useContext(ModelSessionContext)
}

function agentName(id: string) {
  if (id === 'AGT-01') return 'PR Review Agent'
  if (id === 'AGT-02') return 'Meeting Intelligence Agent'
  if (id === 'AGT-03') return 'Architecture Agent'
  if (id === 'AGT-04') return 'Threat Analysis Agent'
  return id
}
