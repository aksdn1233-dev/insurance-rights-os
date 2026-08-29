import { describe, expect, it } from '@jest/globals';

import { parseHospitalResponse } from '../hira-hospital-api';

describe('HIRA hospital API adapter', () => {
  it('turns the official XML response into small hospital summaries', () => {
    const result = parseHospitalResponse(`
      <response><body><items><item>
        <ykiho>encrypted-1</ykiho>
        <yadmNm><![CDATA[튼튼내과]]></yadmNm>
        <addr>서울시 중구 세종대로 1</addr>
        <telno>02-000-0000</telno>
        <clCdNm>의원</clCdNm>
      </item></items></body></response>
    `);

    expect(result).toEqual([
      {
        id: 'encrypted-1',
        name: '튼튼내과',
        address: '서울시 중구 세종대로 1',
        phone: '02-000-0000',
        kind: '의원',
      },
    ]);
  });
});
