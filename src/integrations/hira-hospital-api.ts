const HIRA_HOSPITAL_API_URL =
  'https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList';

export type HospitalSummary = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  kind?: string;
};

export type HiraConnectionState =
  | { status: 'ready'; source: 'HIRA_OPEN_API' }
  | { status: 'key_required'; source: 'HIRA_OPEN_API' };

export function getHiraConnectionState(): HiraConnectionState {
  return process.env.EXPO_PUBLIC_DATA_GO_KR_SERVICE_KEY
    ? { status: 'ready', source: 'HIRA_OPEN_API' }
    : { status: 'key_required', source: 'HIRA_OPEN_API' };
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function tagValue(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`));
  return match ? decodeXml(match[1].trim()) : undefined;
}

export function parseHospitalResponse(xml: string): HospitalSummary[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items
    .map((item) => ({
      id: tagValue(item, 'ykiho') ?? tagValue(item, 'yadmNm') ?? '',
      name: tagValue(item, 'yadmNm') ?? '',
      address: tagValue(item, 'addr') ?? '',
      phone: tagValue(item, 'telno'),
      kind: tagValue(item, 'clCdNm'),
    }))
    .filter((item) => item.id && item.name && item.address);
}

export async function searchHospitalsByName(name: string): Promise<HospitalSummary[]> {
  const serviceKey = process.env.EXPO_PUBLIC_DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error('HIRA_API_KEY_REQUIRED');
  }

  const query = new URLSearchParams({
    serviceKey,
    pageNo: '1',
    numOfRows: '20',
    yadmNm: name.trim(),
  });
  const response = await fetch(`${HIRA_HOSPITAL_API_URL}?${query.toString()}`, {
    headers: { Accept: 'application/xml' },
  });
  if (!response.ok) {
    throw new Error(`HIRA_API_HTTP_${response.status}`);
  }

  const xml = await response.text();
  const resultCode = tagValue(xml, 'resultCode');
  if (resultCode && resultCode !== '00') {
    throw new Error(`HIRA_API_${resultCode}`);
  }
  return parseHospitalResponse(xml);
}

