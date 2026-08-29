import { describe, expect, it } from '@jest/globals';

import { initialEventCatalog } from '../fixtures';

describe('initial 30-event catalog', () => {
  it('contains exactly 30 unique, structured events', () => {
    expect(initialEventCatalog).toHaveLength(30);
    expect(new Set(initialEventCatalog.map((event) => event.id)).size).toBe(30);
    expect(new Set(initialEventCatalog.map((event) => event.concept)).size).toBe(30);
    for (const event of initialEventCatalog) {
      expect(event.label).toBeTruthy();
      expect(event.category).toBeTruthy();
      expect(['candidate', 'needs_review', 'not_matched']).toContain(event.initialExpectedStatus);
    }
  });

  it('does not use inducement or guaranteed-payment copy', () => {
    const copy = JSON.stringify(initialEventCatalog);
    for (const banned of ['무조건 지급', '확정 지급', '병원 가서 용돈', '보험금 많이 나오는 병원']) {
      expect(copy).not.toContain(banned);
    }
  });

  it('keeps only the implemented polyp slice as a direct candidate', () => {
    const candidates = initialEventCatalog.filter((event) => event.initialExpectedStatus === 'candidate');
    expect(candidates.map((event) => event.concept)).toEqual(['colon_polypectomy']);
  });
});
