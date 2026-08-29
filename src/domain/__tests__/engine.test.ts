import { describe, expect, it } from '@jest/globals';

import { runClaimRadar } from '../engine';
import { fixtureColonPolypectomyEvent, fixturePolicy, RULE_BUNDLE_VERSION } from '../fixtures';

describe('Claim Radar', () => {
  it('finds a rule-based candidate with policy, event, and clause provenance', () => {
    const envelope = runClaimRadar(fixturePolicy, fixtureColonPolypectomyEvent);
    const candidate = envelope.result.candidates[0];

    expect(candidate.status).toBe('candidate');
    expect(candidate.headline).toContain('확인할 보험');
    expect(candidate.evidence[0].synthetic).toBe(true);
    expect(envelope.ruleBundleVersion).toBe(RULE_BUNDLE_VERSION);
    expect(envelope.provenance.map((item) => item.sourceType)).toEqual(
      expect.arrayContaining(['fixture', 'policy_clause']),
    );
    expect(envelope.audit[0].metadata).toMatchObject({ candidateCount: 1 });
  });

  it('returns needs_review when a required event fact is missing', () => {
    const event = {
      ...fixtureColonPolypectomyEvent,
      attributes: { procedureConfirmed: true },
    };
    const candidate = runClaimRadar(fixturePolicy, event).result.candidates[0];
    expect(candidate.status).toBe('needs_review');
    expect(candidate.openQuestions).toHaveLength(1);
  });

  it('does not mark an event before coverage start as a candidate', () => {
    const event = { ...fixtureColonPolypectomyEvent, occurredAt: '2023-12-31' };
    const candidate = runClaimRadar(fixturePolicy, event).result.candidates[0];
    expect(candidate.status).toBe('not_matched');
    expect(candidate.benefitLabel).toBeUndefined();
  });

  it('does not invent a candidate when the policy has no matching coverage', () => {
    const policy = { ...fixturePolicy, coverages: [] };
    const result = runClaimRadar(policy, fixtureColonPolypectomyEvent).result;
    expect(result.candidates).toEqual([]);
    expect(result.summary).toContain('찾지 못했어요');
  });
});
