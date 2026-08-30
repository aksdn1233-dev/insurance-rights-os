import { describe, expect, it } from '@jest/globals';

import { betaEvent, betaEventEntryRules, betaEventSafetyNotes } from '@/content/beta-event';

describe('beta event copy', () => {
  it('does not make app-store reviews or positive feedback an entry condition', () => {
    const copy = [
      betaEvent.shortDescription,
      ...betaEventEntryRules.flatMap((rule) => [rule.title, rule.detail]),
      ...betaEventSafetyNotes,
    ].join(' ');

    expect(copy).toContain('비판적인 후기도 똑같이 추첨');
    expect(copy).toContain('앱스토어·구글플레이 별점이나 리뷰는 응모 조건이 아니에요');
    expect(copy).toContain('최대 2회');
  });

  it('keeps the event in preview until mandatory operator details are published', () => {
    expect(betaEvent.status).toBe('preview');
  });
});
