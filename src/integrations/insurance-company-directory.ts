export type InsuranceCompanyType = 'life' | 'non_life';

export type InsuranceCompany = {
  id: string;
  name: string;
  aliases: string[];
  type: InsuranceCompanyType;
  customerCenter: string;
  website: string;
  officialSourceUrl: string;
  hours?: string;
};

export const LIFE_ASSOCIATION_SOURCE = 'https://www.klia.or.kr/klia/company/member/list.do';
export const NON_LIFE_ASSOCIATION_SOURCE = 'https://consumer.knia.or.kr/consumer/company/0201.do';

const life = (
  id: string,
  name: string,
  customerCenter: string,
  website: string,
  aliases: string[] = []
): InsuranceCompany => ({ id, name, aliases, type: 'life', customerCenter, website, officialSourceUrl: LIFE_ASSOCIATION_SOURCE });

const nonLife = (
  id: string,
  name: string,
  customerCenter: string,
  website: string,
  aliases: string[] = [],
  officialSourceUrl = NON_LIFE_ASSOCIATION_SOURCE,
  hours?: string
): InsuranceCompany => ({ id, name, aliases, type: 'non_life', customerCenter, website, officialSourceUrl, hours });

/**
 * 대표 고객센터는 협회 및 보험사 공식 페이지를 2026-08-29에 대조했다.
 * 지점 고유 전화번호가 지도 데이터에 있으면 지점 번호를 우선하고, 없을 때 이 번호를 쓴다.
 */
export const insuranceCompanies: InsuranceCompany[] = [
  life('hanwha-life', '한화생명', '1588-6363', 'https://www.hanwhalife.com'),
  life('abl-life', 'ABL생명', '1588-6500', 'https://www.abllife.co.kr', ['에이비엘생명']),
  life('samsung-life', '삼성생명', '1588-3114', 'https://www.samsunglife.com'),
  life('heungkuk-life', '흥국생명', '1588-2288', 'https://www.heungkuklife.co.kr'),
  life('kyobo-life', '교보생명', '1588-1001', 'https://www.kyobo.com'),
  life('im-life', 'iM라이프', '1588-4770', 'https://www.imlifeins.co.kr', ['아이엠라이프', 'DGB생명', '디지비생명']),
  life('miraeasset-life', '미래에셋생명', '1588-0220', 'https://life.miraeasset.com'),
  life('kdb-life', 'KDB생명', '1588-4040', 'https://www.kdblife.co.kr', ['케이디비생명']),
  life('db-life', 'DB생명', '1588-3131', 'https://www.idblife.com', ['디비생명']),
  life('tongyang-life', '동양생명', '1577-1004', 'https://www.myangel.co.kr'),
  life('metlife', '메트라이프생명', '1588-9600', 'https://www.metlife.co.kr', ['메트라이프', 'Met Life', 'MetLife']),
  life('kb-life', 'KB라이프생명', '1588-3374', 'https://www.kblife.co.kr', ['케이비라이프생명', 'KB생명', '푸르덴셜생명']),
  life('shinhan-life', '신한라이프', '1588-5580', 'https://www.shinhanlife.co.kr', ['신한생명', '오렌지라이프']),
  life('chubb-life', '처브라이프', '1599-4600', 'https://www.chubblife.co.kr', ['처브생명']),
  life('hana-life', '하나생명', '1577-1112', 'https://www.hanalife.co.kr'),
  life('cardif-life', 'BNP파리바카디프생명', '1688-1118', 'https://www.cardif.co.kr', ['카디프생명', '비엔피파리바카디프생명']),
  life('fubon-hyundai', '푸본현대생명', '1577-3311', 'https://www.fubonhyundai.com'),
  life('lina-life', '라이나생명', '1588-0058', 'https://www.lina.co.kr'),
  life('aia-life', 'AIA생명', '1588-9898', 'https://www.aia.co.kr', ['에이아이에이생명']),
  life('nh-life', 'NH농협생명', '1544-4000', 'https://www.nhlife.co.kr', ['농협생명']),

  nonLife('meritz-fire', '메리츠화재', '1566-7711', 'https://www.meritzfire.com'),
  nonLife('hanwha-general', '한화손해보험', '1566-8000', 'https://www.hwgeneralins.com', ['한화손보']),
  nonLife('lotte-insurance', '롯데손해보험', '1588-3344', 'https://www.lotteins.co.kr', ['롯데손보']),
  nonLife(
    'yebyeol-insurance',
    '예별손해보험',
    '1588-5959',
    'https://www.yebyeol.co.kr',
    ['MG손해보험', '엠지손해보험', 'MG손보'],
    'https://www.yebyeol.co.kr/RW021010DM.scp?menuId=MN0501010',
    '평일 09:00~18:00'
  ),
  nonLife('heungkuk-fire', '흥국화재', '1688-1688', 'https://www.heungkukfire.co.kr'),
  nonLife('samsung-fire', '삼성화재', '1588-5114', 'https://www.samsungfire.com'),
  nonLife('hyundai-marine', '현대해상', '1588-5656', 'https://www.hi.co.kr'),
  nonLife('kb-insurance', 'KB손해보험', '1544-0114', 'https://www.kbinsure.co.kr', ['KB손보', '케이비손해보험']),
  nonLife('db-insurance', 'DB손해보험', '1588-0100', 'https://www.idbins.com', ['DB손보', '디비손해보험']),
  nonLife('sgi', 'SGI서울보증', '1670-7000', 'https://www.sgic.co.kr', ['서울보증보험', '서울보증']),
  nonLife('axa', 'AXA손해보험', '1566-1566', 'https://www.axa.co.kr', ['악사손해보험', 'AXA']),
  nonLife('aig', 'AIG손해보험', '1544-2792', 'https://www.aig.co.kr', ['에이아이지손해보험']),
  nonLife('chubb-fire', '라이나손해보험', '1566-5800', 'https://www.chubb.com/kr-ko', ['에이스손해보험', '처브손해보험']),
  nonLife('shinhan-ez', '신한EZ손해보험', '1544-2580', 'https://www.shinhanez.co.kr', ['신한이지손해보험']),
  nonLife('nh-fire', 'NH농협손해보험', '1644-9000', 'https://www.nhfire.co.kr', ['농협손해보험']),
  nonLife('carrot', '캐롯손해보험', '1566-0300', 'https://www.carrotins.com', ['캐롯퍼마일']),
  nonLife(
    'hana-insurance',
    '하나손해보험',
    '1566-3000',
    'https://www.hanainsure.co.kr',
    ['하나손보'],
    'https://www.hanainsure.co.kr/w/customer/homepageInfo/customerWork',
    '평일 09:00~18:00 · 사고접수·긴급출동 24시간'
  ),
  nonLife(
    'kakaopay-insurance',
    '카카오페이손해보험',
    '1544-0022',
    'https://kakaopayinscorp.co.kr',
    ['카카오손해보험', '카카오페이손보'],
    'https://kakaopayinscorp.co.kr/customer-center/customer-center',
    '평일 09:00~18:00 · 주말·공휴일 휴무'
  ),
];

function normalized(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/주식회사|보험회사|보험|지점|고객지원센터|고객센터|본사|빌딩|\s|[()·._-]/g, '');
}

export function findInsuranceCompany(value?: string) {
  const target = normalized(value ?? '');
  if (!target) return undefined;
  return insuranceCompanies.find((company) =>
    [company.name, ...company.aliases].some((name) => {
      const candidate = normalized(name);
      return candidate.length >= 2 && (target.includes(candidate) || candidate.includes(target));
    })
  );
}

export function filterInsuranceCompanies(query: string, type?: InsuranceCompanyType) {
  const target = normalized(query);
  return insuranceCompanies.filter((company) => {
    if (type && company.type !== type) return false;
    if (!target) return true;
    return [company.name, ...company.aliases, company.customerCenter].some((value) => normalized(value).includes(target));
  });
}
