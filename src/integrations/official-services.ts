import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export type OfficialServiceId = 'nhis-refund' | 'find-my-insurance' | 'silson24' | 'hira-map';

export type OfficialService = {
  id: OfficialServiceId;
  title: string;
  description: string;
  actionLabel: string;
  url: string;
  connection: 'official-web';
  requiresIdentityVerification: boolean;
};

export const officialServices: Record<OfficialServiceId, OfficialService> = {
  'nhis-refund': {
    id: 'nhis-refund',
    title: '건강보험 환급금',
    description: '국민건강보험에 로그인해 환급금을 확인해요.',
    actionLabel: '공식 조회 열기',
    url: 'https://www.nhis.or.kr/nhis/minwon/retrieveHwangub.do',
    connection: 'official-web',
    requiresIdentityVerification: true,
  },
  'find-my-insurance': {
    id: 'find-my-insurance',
    title: '숨은 보험금',
    description: '내보험찾아줌에서 가입 보험과 숨은 보험금을 확인해요.',
    actionLabel: '공식 조회 열기',
    url: 'https://cont.insure.or.kr/',
    connection: 'official-web',
    requiresIdentityVerification: true,
  },
  silson24: {
    id: 'silson24',
    title: '실손24 청구',
    description: '서류 없이 가능한 진료라면 실손24에서 바로 청구해요.',
    actionLabel: '공식 청구 열기',
    url: 'https://www.silson24.or.kr/claim/web/',
    connection: 'official-web',
    requiresIdentityVerification: true,
  },
  'hira-map': {
    id: 'hira-map',
    title: '공식 병원 찾기',
    description: '심평원 건강지도에서 병원 정보를 확인해요.',
    actionLabel: '건강지도 열기',
    url: 'https://www.hira.or.kr/ra/hosp/getHealthMap.do?WT=&tabgbn=02',
    connection: 'official-web',
    requiresIdentityVerification: false,
  },
};

export async function openOfficialService(id: OfficialServiceId) {
  const url = officialServices[id].url;
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
    return 'in_app' as const;
  } catch {
    try {
      await Linking.openURL(url);
      return 'system' as const;
    } catch {
      return 'failed' as const;
    }
  }
}
