import { describe, expect, it } from '@jest/globals';

import { runClaimRadar } from '../engine';
import { FIXTURE_NOW, fixtureColonPolypectomyEvent, fixturePolicy } from '../fixtures';
import { learnFromOutcome } from '../outcome';
import { assessClaimReadiness } from '../readiness';
import type { ClaimOutcome, UploadedDocument } from '../types';

const outcomeCases: ['paid' | 'denied', 'monitor' | 'queue_rule_review'][] = [
  ['paid', 'monitor'],
  ['denied', 'queue_rule_review'],
];

describe('Phase 0 vertical slice', () => {
  const candidate = runClaimRadar(fixturePolicy, fixtureColonPolypectomyEvent).result.candidates[0];

  it('moves from a candidate to 100% readiness only with all accepted requirements', () => {
    const partial: UploadedDocument[] = [
      {
        id: 'one',
        requirementId: candidate.requiredDocuments[0].id,
        fileName: 'one.pdf',
        source: 'picker',
        validation: 'accepted',
      },
    ];
    const partialReadiness = assessClaimReadiness(candidate, partial).result;
    expect(partialReadiness.score).toBe(33);
    expect(partialReadiness.readyToSubmit).toBe(false);

    const complete = candidate.requiredDocuments.map((requirement) => ({
      id: `fixture-${requirement.id}`,
      requirementId: requirement.id,
      fileName: `${requirement.title}.pdf`,
      source: 'fixture' as const,
      validation: 'accepted' as const,
    }));
    const completeEnvelope = assessClaimReadiness(candidate, complete);
    expect(completeEnvelope.result.score).toBe(100);
    expect(completeEnvelope.result.readyToSubmit).toBe(true);
    expect(completeEnvelope.provenance).toHaveLength(3);
  });

  it('does not treat an unreviewed picked file as claim-ready', () => {
    const pickedButUnreviewed: UploadedDocument[] = candidate.requiredDocuments.map((requirement) => ({
      id: `picked-${requirement.id}`,
      requirementId: requirement.id,
      fileName: '휴대폰에서 고른 서류',
      source: 'picker',
      validation: 'needs_review',
    }));

    const readiness = assessClaimReadiness(candidate, pickedButUnreviewed).result;
    expect(readiness.score).toBe(0);
    expect(readiness.readyToSubmit).toBe(false);
  });

  it.each(outcomeCases)('records %s without automatic rule mutation', (status, expectedAction) => {
    const outcome: ClaimOutcome = {
      id: `outcome-${status}`,
      candidateId: candidate.id,
      status,
      reasonCode: `fixture-${status}`,
      reasonLabel: `테스트 ${status}`,
      source: 'fixture',
      receivedAt: FIXTURE_NOW,
    };
    const envelope = learnFromOutcome(candidate, fixtureColonPolypectomyEvent, outcome);
    expect(envelope.result.action).toBe(expectedAction);
    expect(envelope.audit[0].metadata.automaticRuleMutation).toBe(false);
    expect(envelope.provenance[0].sourceId).toBe(outcome.id);
  });
});
