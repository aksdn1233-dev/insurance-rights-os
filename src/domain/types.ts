export type SourceType =
  | 'policy_clause'
  | 'user_input'
  | 'document'
  | 'fixture'
  | 'external';

export type CandidateStatus = 'candidate' | 'needs_review' | 'not_matched';

export type ProvenanceRef = {
  sourceType: SourceType;
  sourceId: string;
  version?: string;
  contentHash?: string;
  capturedAt: string;
};

export type AuditEvent = {
  id: string;
  actorType: 'user' | 'system' | 'expert' | 'partner';
  action: string;
  subjectRefs: string[];
  at: string;
  correlationId: string;
  metadata: Record<string, string | number | boolean>;
};

export type ClauseEvidence = {
  clauseId: string;
  policyVersionId: string;
  path: string;
  title: string;
  excerpt: string;
  contentHash: string;
  synthetic: boolean;
};

export type Coverage = {
  id: string;
  title: string;
  benefitLabel: string;
  triggerConcepts: string[];
  requiredAttributes: string[];
  documentRequirements: DocumentRequirement[];
  evidence: ClauseEvidence;
};

export type PolicyContract = {
  id: string;
  insurer: string;
  productName: string;
  insuredPersonId: string;
  policyVersionId: string;
  coverageStartDate: string;
  coverageEndDate?: string;
  coverages: Coverage[];
  source: 'fixture' | 'upload' | 'manual' | 'live';
};

export type MedicalEvent = {
  id: string;
  personId: string;
  occurredAt: string;
  label: string;
  concept: string;
  attributes: Record<string, string | boolean | number>;
  source: 'fixture' | 'upload' | 'manual' | 'live';
};

export type DocumentKind =
  | 'procedure_confirmation'
  | 'itemized_statement'
  | 'medical_receipt';

export type DocumentRequirement = {
  id: string;
  kind: DocumentKind;
  title: string;
  reason: string;
};

export type UploadedDocument = {
  id: string;
  requirementId: string;
  fileName: string;
  source: 'picker' | 'fixture';
  validation: 'accepted' | 'needs_review' | 'rejected';
};

export type ClaimCandidate = {
  id: string;
  policyId: string;
  policyVersionId: string;
  coverageId: string;
  medicalEventId: string;
  status: CandidateStatus;
  headline: string;
  matchReasons: string[];
  openQuestions: string[];
  benefitLabel?: string;
  evidence: ClauseEvidence[];
  requiredDocuments: DocumentRequirement[];
};

export type RadarResult = {
  candidates: ClaimCandidate[];
  checkedCoverageCount: number;
  summary: string;
};

export type ReadinessAssessment = {
  requiredCount: number;
  acceptedCount: number;
  missingRequirementIds: string[];
  score: number;
  readyToSubmit: boolean;
};

export type ClaimOutcomeStatus = 'paid' | 'partially_paid' | 'denied' | 'withdrawn';

export type ClaimOutcome = {
  id: string;
  candidateId: string;
  status: ClaimOutcomeStatus;
  reasonCode: string;
  reasonLabel: string;
  amount?: number;
  source: 'fixture' | 'external' | 'manual';
  receivedAt: string;
};

export type LearningSignal = {
  id: string;
  candidateId: string;
  coverageId: string;
  eventConcept: string;
  outcomeStatus: ClaimOutcomeStatus;
  outcomeReasonCode: string;
  action: 'monitor' | 'queue_rule_review';
  note: string;
};

export type EngineEnvelope<T> = {
  result: T;
  provenance: ProvenanceRef[];
  audit: AuditEvent[];
  ruleBundleVersion: string;
  evaluatedAt: string;
};

export type EventCatalogItem = {
  id: string;
  label: string;
  concept: string;
  category: string;
  initialExpectedStatus: CandidateStatus;
  requiredQuestion?: string;
};
