import { describe, expect, it } from '@jest/globals';

import { parseStoredDemoState } from '../stored-demo-state';

describe('saved demo state', () => {
  it('ignores broken JSON instead of leaving the app on a blank screen', () => {
    expect(parseStoredDemoState('{broken')).toBeUndefined();
  });

  it('ignores impossible stage shapes', () => {
    expect(parseStoredDemoState(JSON.stringify({ stage: 'outcome', documents: [], audit: [] }))).toBeUndefined();
    expect(parseStoredDemoState(JSON.stringify({ stage: 'unknown', documents: [], audit: [] }))).toBeUndefined();
  });

  it('accepts the empty first stage', () => {
    expect(parseStoredDemoState(JSON.stringify({ stage: 'contract', documents: [], audit: [] }))).toMatchObject({
      stage: 'contract',
    });
  });
});
