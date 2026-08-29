import { FIXTURE_NOW, RULE_BUNDLE_VERSION } from './fixtures';
import type {
  AuditEvent,
  ClaimCandidate,
  EngineEnvelope,
  MedicalEvent,
  PolicyContract,
  ProvenanceRef,
  RadarResult,
} from './types';

const makeAudit = (
  action: string,
  refs: string[],
  correlationId: string,
  metadata: AuditEvent['metadata'] = {},
): AuditEvent => ({
  id: `audit-${correlationId}-${action}`,
  actorType: 'system',
  action,
  subjectRefs: refs,
  at: FIXTURE_NOW,
  correlationId,
  metadata,
});

const policyProvenance = (policy: PolicyContract): ProvenanceRef => ({
  sourceType: policy.source === 'fixture' ? 'fixture' : 'external',
  sourceId: policy.id,
  version: policy.policyVersionId,
  capturedAt: FIXTURE_NOW,
});

const eventProvenance = (event: MedicalEvent): ProvenanceRef => ({
  sourceType: event.source === 'fixture' ? 'fixture' : 'user_input',
  sourceId: event.id,
  capturedAt: FIXTURE_NOW,
});

export function runClaimRadar(
  policy: PolicyContract,
  event: MedicalEvent,
): EngineEnvelope<RadarResult> {
  const correlationId = `radar-${policy.id}-${event.id}`;
  const withinCoverage =
    event.occurredAt >= policy.coverageStartDate &&
    (!policy.coverageEndDate || event.occurredAt <= policy.coverageEndDate);

  const candidates: ClaimCandidate[] = policy.coverages.flatMap((coverage) => {
    if (!coverage.triggerConcepts.includes(event.concept)) return [];

    const missing = coverage.requiredAttributes.filter(
      (key) => event.attributes[key] !== true && !event.attributes[key],
    );
    const status = !withinCoverage
      ? 'not_matched'
      : missing.length > 0
        ? 'needs_review'
        : 'candidate';

    return [
      {
        id: `candidate-${coverage.id}-${event.id}`,
        policyId: policy.id,
        policyVersionId: policy.policyVersionId,
        coverageId: coverage.id,
        medicalEventId: event.id,
        status,
        headline:
          status === 'candidate'
            ? '확인할 보험이 1개 있어요'
            : status === 'needs_review'
              ? '조금 더 알아봐야 할 보험이 있어요'
              : '보험이 보장하는 기간과 맞지 않아요',
        matchReasons: [
          `받은 치료 “${event.label}”가 이 보험에 적힌 치료와 맞아요.`,
          '가입한 때에 맞는 2024년 1월 약관을 확인했어요.',
        ],
        openQuestions: missing.map(() => '치료 기록을 조금 더 확인해야 해요.'),
        benefitLabel: status === 'candidate' ? coverage.benefitLabel : undefined,
        evidence: [coverage.evidence],
        requiredDocuments: coverage.documentRequirements,
      },
    ];
  });

  const summary =
    candidates.length === 0
      ? '지금 불러온 보험에서는 확인할 항목을 찾지 못했어요.'
      : candidates.some((candidate) => candidate.status === 'candidate')
        ? '확인할 보험이 있어요. 실제 지급은 보험사가 마지막에 결정해요.'
        : '적은 내용이나 보험 기간을 조금 더 확인해야 해요.';

  const evidenceProvenance: ProvenanceRef[] = candidates.flatMap((candidate) =>
    candidate.evidence.map((evidence) => ({
      sourceType: 'policy_clause' as const,
      sourceId: evidence.clauseId,
      version: evidence.policyVersionId,
      contentHash: evidence.contentHash,
      capturedAt: FIXTURE_NOW,
    })),
  );

  return {
    result: {
      candidates,
      checkedCoverageCount: policy.coverages.length,
      summary,
    },
    provenance: [policyProvenance(policy), eventProvenance(event), ...evidenceProvenance],
    audit: [
      makeAudit('claim_radar_evaluated', [policy.id, event.id], correlationId, {
        checkedCoverageCount: policy.coverages.length,
        candidateCount: candidates.length,
        ruleBundleVersion: RULE_BUNDLE_VERSION,
      }),
    ],
    ruleBundleVersion: RULE_BUNDLE_VERSION,
    evaluatedAt: FIXTURE_NOW,
  };
}
