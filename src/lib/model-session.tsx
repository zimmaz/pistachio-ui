import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { REVIEWS } from '@/data/reviews'
import type { FindingDecision, FindingStatus, Review, ReviewStatus } from '@/data/types'

export interface AcceptedRiskRecord {
  riskOwner: string
  securityApprover: string
  justification: string
  compensatingControls: string[]
  expires: string
  reviewDate: string
}

interface ModelSessionValue {
  currentVersion: 'v18' | 'v19'
  webhookApproved: boolean
  pendingProposalCount: number
  lastApprovedLabel: string
  reviewStatus: (id: string) => ReviewStatus
  pendingReviews: Review[]
  decideReview: (id: string, status: ReviewStatus, note?: string) => void
  reviewNote: (id: string) => string | undefined
  findingDecision: (id: string) => FindingDecision | undefined
  recordFinding: (id: string, decision: FindingDecision) => void
  acceptedRisk: (id: string) => AcceptedRiskRecord | undefined
  recordAcceptedRisk: (id: string, record: AcceptedRiskRecord) => void
}

const ModelSessionContext = createContext<ModelSessionValue | null>(null)

export function ModelSessionProvider({ children }: { children: ReactNode }) {
  const [reviewDecisions, setReviewDecisions] = useState<Record<string, ReviewStatus>>({})
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [findingDecisions, setFindingDecisions] = useState<Record<string, FindingDecision>>({})
  const [acceptedRisks, setAcceptedRisks] = useState<Record<string, AcceptedRiskRecord>>({})

  const reviewStatus = useCallback(
    (id: string) => reviewDecisions[id] ?? REVIEWS.find((review) => review.id === id)?.status ?? 'Pending',
    [reviewDecisions],
  )

  const webhookApproved = reviewStatus('REV-021') === 'Approved'
  const currentVersion: 'v18' | 'v19' = webhookApproved ? 'v19' : 'v18'

  const pendingReviews = useMemo(
    () => REVIEWS.filter((review) => (reviewDecisions[review.id] ?? review.status) === 'Pending'),
    [reviewDecisions],
  )

  const pendingProposalCount = pendingReviews.filter((review) => review.type === 'Model Change').length

  const decideReview = useCallback((id: string, status: ReviewStatus, note?: string) => {
    setReviewDecisions((prev) => ({ ...prev, [id]: status }))
    if (note) setReviewNotes((prev) => ({ ...prev, [id]: note }))
  }, [])

  const recordFinding = useCallback((id: string, decision: FindingDecision) => {
    setFindingDecisions((prev) => ({ ...prev, [id]: decision }))
  }, [])

  const recordAcceptedRisk = useCallback((id: string, record: AcceptedRiskRecord) => {
    setAcceptedRisks((prev) => ({ ...prev, [id]: record }))
    setFindingDecisions((prev) => ({
      ...prev,
      [id]: {
        status: 'Risk accepted' as FindingStatus,
        note: `Risk accepted by ${record.riskOwner}. Approved by ${record.securityApprover}. Expires ${record.expires}.`,
      },
    }))
  }, [])

  const value = useMemo<ModelSessionValue>(
    () => ({
      currentVersion,
      webhookApproved,
      pendingProposalCount,
      lastApprovedLabel: webhookApproved ? 'just now' : '2 hours ago',
      reviewStatus,
      pendingReviews,
      decideReview,
      reviewNote: (id: string) => reviewNotes[id],
      findingDecision: (id: string) => findingDecisions[id],
      recordFinding,
      acceptedRisk: (id: string) => acceptedRisks[id],
      recordAcceptedRisk,
    }),
    [
      acceptedRisks,
      currentVersion,
      decideReview,
      findingDecisions,
      pendingProposalCount,
      pendingReviews,
      recordAcceptedRisk,
      recordFinding,
      reviewNotes,
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
