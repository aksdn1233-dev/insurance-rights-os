import { describe, expect, it } from '@jest/globals';

import { GLOBAL_BUSINESS_FOOTER_POLICY } from '@/content/business-protection';

describe('business protection policy', () => {
  it('uses a truthful level B notice instead of the strong traceability claim', () => {
    expect(GLOBAL_BUSINESS_FOOTER_POLICY.level).toBe('B');
    expect(GLOBAL_BUSINESS_FOOTER_POLICY.notice).toContain('확인 가능한 서버 기록');
    expect(GLOBAL_BUSINESS_FOOTER_POLICY.notice).not.toContain('침해 식별·추적 및 증거보존을 위한 기술적 보호조치');
    expect(GLOBAL_BUSINESS_FOOTER_POLICY.limitation).toContain('보장하지 않습니다');
  });
});
