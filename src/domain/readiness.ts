import { FIXTURE_NOW, RULE_BUNDLE_VERSION } from './fixtures';
import type {
  ClaimCandidate,
  EngineEnvelope,
  ReadinessAssessment,
  UploadedDocument,
} from './types';

export function assessClaimReadiness(
  candidate: ClaimCandidate,
  documents: UploadedDocument[],
): EngineEnvelope<ReadinessAssessment> {
  const acceptedRequirementIds = new Set(
    documents
      .filter((document) => document.validation === 'accepted')
      .map((document) => document.requirementId),
  );
  const missingRequirementIds = candidate.requiredDocuments
    .filter((requirement) => !acceptedRequirementIds.has(requirement.id))
    .map((requirement) => requirement.id);
  const requiredCount = candidate.requiredDocuments.length;
  const acceptedCount = requiredCount - missingRequirementIds.length;
  const score = requiredCount === 0 ? 100 : Math.round((acceptedCount / requiredCount) * 100);
  const correlationId = `readiness-${candidate.id}`;

  return {
    result: {
      requiredCount,
      acceptedCount,
      missingRequirementIds,
      score,
      readyToSubmit: candidate.status === 'candidate' && score === 100,
    },
    provenance: documents.map((document) => ({
      sourceType: document.source === 'fixture' ? 'fixture' : 'document',
      sourceId: document.id,
      capturedAt: FIXTURE_NOW,
    })),
    audit: [
      {
        id: `audit-${correlationId}`,
        actorType: 'system',
        action: 'claim_readiness_assessed',
        subjectRefs: [candidate.id],
        at: FIXTURE_NOW,
        correlationId,
        metadata: { score, acceptedCount, requiredCount },
      },
    ],
    ruleBundleVersion: RULE_BUNDLE_VERSION,
    evaluatedAt: FIXTURE_NOW,
  };
}
