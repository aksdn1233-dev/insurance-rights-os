import { describe, expect, it } from '@jest/globals';

import { officialServices } from '../official-services';

describe('official service connections', () => {
  it('uses HTTPS official domains only', () => {
    expect(Object.values(officialServices)).toHaveLength(4);
    expect(Object.values(officialServices).every((service) => service.url.startsWith('https://'))).toBe(true);
    expect(officialServices['nhis-refund'].url).toContain('nhis.or.kr');
    expect(officialServices['find-my-insurance'].url).toContain('cont.insure.or.kr');
    expect(officialServices.silson24.url).toContain('silson24.or.kr');
    expect(officialServices['hira-map'].url).toContain('hira.or.kr');
  });

  it('marks services that require the user to identify themselves', () => {
    expect(officialServices['nhis-refund'].requiresIdentityVerification).toBe(true);
    expect(officialServices['find-my-insurance'].requiresIdentityVerification).toBe(true);
    expect(officialServices.silson24.requiresIdentityVerification).toBe(true);
    expect(officialServices['hira-map'].requiresIdentityVerification).toBe(false);
  });
});
