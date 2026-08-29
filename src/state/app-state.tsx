import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { runClaimRadar } from '@/domain/engine';
import {
  FIXTURE_NOW,
  fixtureColonPolypectomyEvent,
  fixturePolicy,
} from '@/domain/fixtures';
import { learnFromOutcome } from '@/domain/outcome';
import { assessClaimReadiness } from '@/domain/readiness';
import type {
  AuditEvent,
  ClaimOutcome,
} from '@/domain/types';
import { parseStoredDemoState } from '@/state/stored-demo-state';
import type { DemoState } from '@/state/stored-demo-state';

export type { DemoState, DemoStage } from '@/state/stored-demo-state';

type AppStateValue = DemoState & {
  hydrated: boolean;
  guideSeen: boolean;
  completeFirstRunGuide: () => void;
  restartFirstRunGuide: () => void;
  registerFixturePolicy: () => void;
  recordFixtureEvent: () => void;
  showEvidence: () => void;
  startDocuments: () => void;
  addPickedDocuments: (fileNames: string[]) => void;
  fillFixtureDocuments: () => void;
  submitFixtureClaim: () => void;
  recordFixtureOutcome: (status: 'paid' | 'denied') => void;
  resetDemo: () => void;
};

const STORAGE_KEY = 'insurance-rights-os:phase0-demo:v4';
const GUIDE_STORAGE_KEY = 'insurance-rights-os:first-run-guide:v3';

const initialState: DemoState = {
  stage: 'contract',
  documents: [],
  audit: [],
};

const AppStateContext = createContext<AppStateValue | null>(null);

const userAudit = (action: string, subjectRefs: string[]): AuditEvent => ({
  id: `audit-user-${action}-${subjectRefs.join('-')}`,
  actorType: 'user',
  action,
  subjectRefs,
  at: FIXTURE_NOW,
  correlationId: 'vertical-slice-fixture-001',
  metadata: { fixture: true },
});

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<DemoState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [guideSeen, setGuideSeen] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(GUIDE_STORAGE_KEY)])
      .then(([storedState, storedGuide]) => {
        const parsedState = parseStoredDemoState(storedState);
        if (parsedState) setState(parsedState);
        setGuideSeen(storedGuide === 'true');
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // Demo persistence failure must not block the offline fixture flow.
    });
  }, [hydrated, state]);

  const value = useMemo<AppStateValue>(
    () => ({
      ...state,
      hydrated,
      guideSeen,
      completeFirstRunGuide: () => {
        setGuideSeen(true);
        AsyncStorage.setItem(GUIDE_STORAGE_KEY, 'true').catch(() => undefined);
      },
      restartFirstRunGuide: () => {
        setGuideSeen(false);
        AsyncStorage.setItem(GUIDE_STORAGE_KEY, 'false').catch(() => undefined);
      },
      registerFixturePolicy: () =>
        setState((current) => ({
          ...current,
          stage: 'event',
          policy: fixturePolicy,
          audit: [...current.audit, userAudit('fixture_policy_registered', [fixturePolicy.id])],
        })),
      recordFixtureEvent: () => {
        const policy = state.policy ?? fixturePolicy;
        const radar = runClaimRadar(policy, fixtureColonPolypectomyEvent);
        setState((current) => ({
          ...current,
          stage: 'candidate',
          policy,
          event: fixtureColonPolypectomyEvent,
          candidate: radar.result.candidates[0],
          audit: [...current.audit, ...radar.audit],
        }));
      },
      showEvidence: () => setState((current) => ({ ...current, stage: 'evidence' })),
      startDocuments: () => setState((current) => ({ ...current, stage: 'documents' })),
      addPickedDocuments: (fileNames) =>
        setState((current) => {
          if (!current.candidate) return current;
          const used = new Set(current.documents.map((document) => document.requirementId));
          const available = current.candidate.requiredDocuments.filter(
            (requirement) => !used.has(requirement.id),
          );
          const added = fileNames.slice(0, available.length).map((_, index) => ({
            id: `document-picker-${Date.now()}-${index}`,
            requirementId: available[index].id,
            fileName: `휴대폰에서 고른 서류 ${index + 1}`,
            source: 'picker' as const,
            validation: 'needs_review' as const,
          }));
          const documents = [...current.documents, ...added];
          const readiness = assessClaimReadiness(current.candidate, documents);
          return {
            ...current,
            stage: readiness.result.readyToSubmit ? 'ready' : 'documents',
            documents,
            readiness: readiness.result,
            audit: [...current.audit, ...readiness.audit],
          };
        }),
      fillFixtureDocuments: () =>
        setState((current) => {
          if (!current.candidate) return current;
          const documents = current.candidate.requiredDocuments.map((requirement) => ({
            id: `document-fixture-${requirement.id}`,
            requirementId: requirement.id,
            fileName: `${requirement.title} (연습용).pdf`,
            source: 'fixture' as const,
            validation: 'accepted' as const,
          }));
          const readiness = assessClaimReadiness(current.candidate, documents);
          return {
            ...current,
            stage: 'ready',
            documents,
            readiness: readiness.result,
            audit: [...current.audit, ...readiness.audit],
          };
        }),
      submitFixtureClaim: () =>
        setState((current) => {
          if (!current.readiness?.readyToSubmit || !current.candidate) return current;
          return {
            ...current,
            stage: 'submitted',
            submittedAt: FIXTURE_NOW,
            audit: [
              ...current.audit,
              userAudit('fixture_claim_submitted', [current.candidate.id]),
            ],
          };
        }),
      recordFixtureOutcome: (status) =>
        setState((current) => {
          if (!current.candidate || !current.event) return current;
          const outcome: ClaimOutcome = {
            id: `outcome-fixture-${status}`,
            candidateId: current.candidate.id,
            status,
            amount: status === 'paid' ? 200000 : undefined,
            reasonCode: status === 'paid' ? 'fixture_terms_matched' : 'fixture_definition_review',
            reasonLabel:
              status === 'paid'
                ? '보험에 적힌 내용과 준비한 서류가 맞아요'
                : '보험에 적힌 뜻을 전문가가 더 확인해야 해요',
            source: 'fixture',
            receivedAt: FIXTURE_NOW,
          };
          const learning = learnFromOutcome(current.candidate, current.event, outcome);
          return {
            ...current,
            stage: 'outcome',
            outcome,
            learningSignal: learning.result,
            audit: [...current.audit, ...learning.audit],
          };
        }),
      resetDemo: () => {
        setState(initialState);
        AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
      },
    }),
    [guideSeen, hydrated, state],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used inside AppStateProvider');
  return value;
}
