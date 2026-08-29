import { FIXTURE_NOW, RULE_BUNDLE_VERSION } from './fixtures';
import type {
  ClaimCandidate,
  ClaimOutcome,
  EngineEnvelope,
  LearningSignal,
  MedicalEvent,
} from './types';

export function learnFromOutcome(
  candidate: ClaimCandidate,
  event: MedicalEvent,
  outcome: ClaimOutcome,
): EngineEnvelope<LearningSignal> {
  const shouldReview = outcome.status === 'denied' || outcome.status === 'partially_paid';
  const signal: LearningSignal = {
    id: `learning-${outcome.id}`,
    candidateId: candidate.id,
    coverageId: candidate.coverageId,
    eventConcept: event.concept,
    outcomeStatus: outcome.status,
    outcomeReasonCode: outcome.reasonCode,
    action: shouldReview ? 'queue_rule_review' : 'monitor',
    note: shouldReview
      ? '답을 자동으로 바꾸지 않았어요. 전문가가 다시 살펴볼 목록에 넣었어요.'
      : '지급됐다는 기록만 더했어요. 보험 기준은 자동으로 바꾸지 않았어요.',
  };

  return {
    result: signal,
    provenance: [
      {
        sourceType: outcome.source === 'fixture' ? 'fixture' : 'external',
        sourceId: outcome.id,
        capturedAt: outcome.receivedAt,
      },
    ],
    audit: [
      {
        id: `audit-learning-${outcome.id}`,
        actorType: 'system',
        action: 'claim_outcome_learning_signal_recorded',
        subjectRefs: [candidate.id, outcome.id],
        at: FIXTURE_NOW,
        correlationId: `outcome-${candidate.id}`,
        metadata: {
          outcomeStatus: outcome.status,
          action: signal.action,
          automaticRuleMutation: false,
        },
      },
    ],
    ruleBundleVersion: RULE_BUNDLE_VERSION,
    evaluatedAt: FIXTURE_NOW,
  };
}
