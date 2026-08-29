import { describe, expect, it } from '@jest/globals';

import { firstRunGuideSlides } from '../first-run-guide';

describe('first-run guide', () => {
  it('introduces all four bottom tabs exactly once', () => {
    expect(firstRunGuideSlides.map((slide) => slide.tab)).toEqual(['홈', '가족', '병원', '내 보험']);
  });

  it('uses plain language and includes the refund finder', () => {
    const copy = JSON.stringify(firstRunGuideSlides);
    expect(copy).toContain('환급금');
    for (const technicalTerm of ['Claim', 'Radar', 'Engine', 'fixture', 'Guardian']) {
      expect(copy).not.toContain(technicalTerm);
    }
  });
});
