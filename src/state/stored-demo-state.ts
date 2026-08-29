import type {
  AuditEvent,
  ClaimCandidate,
  ClaimOutcome,
  LearningSignal,
  MedicalEvent,
  PolicyContract,
  ReadinessAssessment,
  UploadedDocument,
} from '@/domain/types';

export type DemoStage =
  | 'contract'
  | 'event'
  | 'candidate'
  | 'evidence'
  | 'documents'
  | 'ready'
  | 'submitted'
  | 'outcome';

export type DemoState = {
  stage: DemoStage;
  policy?: PolicyContract;
  event?: MedicalEvent;
  candidate?: ClaimCandidate;
  documents: UploadedDocument[];
  readiness?: ReadinessAssessment;
  submittedAt?: string;
  outcome?: ClaimOutcome;
  learningSignal?: LearningSignal;
  audit: AuditEvent[];
};

const stages: DemoStage[] = ['contract', 'event', 'candidate', 'evidence', 'documents', 'ready', 'submitted', 'outcome'];

export function parseStoredDemoState(value: string | null): DemoState | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as Partial<DemoState>;
    if (!parsed || !stages.includes(parsed.stage as DemoStage)) return undefined;
    if (!Array.isArray(parsed.documents) || !Array.isArray(parsed.audit)) return undefined;

    const stage = parsed.stage as DemoStage;
    if (stage !== 'contract' && !parsed.policy) return undefined;
    if (['candidate', 'evidence', 'documents', 'ready', 'submitted', 'outcome'].includes(stage)) {
      if (!parsed.event || !parsed.candidate) return undefined;
    }
    if (['ready', 'submitted', 'outcome'].includes(stage) && !parsed.readiness?.readyToSubmit) {
      return undefined;
    }
    if (stage === 'outcome' && (!parsed.outcome || !parsed.learningSignal)) return undefined;

    return parsed as DemoState;
  } catch {
    return undefined;
  }
}

