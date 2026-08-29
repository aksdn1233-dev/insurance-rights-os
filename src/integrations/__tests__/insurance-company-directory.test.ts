import { describe, expect, it } from '@jest/globals';

import { filterInsuranceCompanies, findInsuranceCompany, insuranceCompanies } from '../insurance-company-directory';

describe('insurance company directory', () => {
  it('covers the full-member life insurers and major non-life insurers', () => {
    expect(insuranceCompanies.filter((company) => company.type === 'life')).toHaveLength(20);
    expect(insuranceCompanies.filter((company) => company.type === 'non_life').length).toBeGreaterThanOrEqual(17);
  });

  it('matches old names and map-style branch names to the current company', () => {
    expect(findInsuranceCompany('삼성화재 강북고객지원센터')?.customerCenter).toBe('1588-5114');
    expect(findInsuranceCompany('MG손해보험 부산지점')?.name).toBe('예별손해보험');
    expect(findInsuranceCompany('DGB생명 본사')?.name).toBe('iM라이프');
  });

  it('filters by friendly company name and type', () => {
    expect(filterInsuranceCompanies('농협', 'life').map((company) => company.name)).toEqual(['NH농협생명']);
    expect(filterInsuranceCompanies('농협', 'non_life').map((company) => company.name)).toEqual(['NH농협손해보험']);
  });

  it('stores a callable number and official source for every entry', () => {
    insuranceCompanies.forEach((company) => {
      expect(company.customerCenter).toMatch(/^\d{2,4}-\d{3,4}(?:-\d{4})?$/);
      expect(company.officialSourceUrl).toMatch(/^https:\/\//);
    });
  });
});
