import { describe, expect, it } from '@jest/globals';

import {
  formatDistance,
  kakaoDirectionsUrl,
  kakaoRoadviewUrl,
  parseLocationSearchResponse,
  parsePhotonLocationSearchResponse,
  phoneLink,
  readableOpeningHours,
} from '../hospital-discovery';

describe('hospital discovery presentation helpers', () => {
  it('writes short distances in words that are easy to scan', () => {
    expect(formatDistance(840)).toBe('840m');
    expect(formatDistance(1840)).toBe('1.8km');
    expect(formatDistance()).toBe('거리 확인 중');
  });

  it('only creates a phone action when a phone number exists', () => {
    expect(phoneLink('02-1234-5678')).toBe('tel:0212345678');
    expect(phoneLink('  ')).toBeUndefined();
  });

  it('uses Kakao place IDs when available and coordinates otherwise', () => {
    const kakao = { id: '12345', name: '튼튼병원', latitude: 37.5, longitude: 127, source: 'KAKAO' as const };
    const osm = { id: 'node-1', name: '튼튼 병원', latitude: 37.5, longitude: 127, source: 'OPENSTREETMAP' as const };

    expect(kakaoDirectionsUrl(kakao)).toBe('https://map.kakao.com/link/to/12345');
    expect(kakaoRoadviewUrl(kakao)).toBe('https://map.kakao.com/link/roadview/12345');
    expect(kakaoDirectionsUrl(osm)).toContain('%ED%8A%BC%ED%8A%BC%20%EB%B3%91%EC%9B%90,37.5,127');
  });

  it('does not invent opening hours', () => {
    expect(readableOpeningHours()).toBe('진료시간은 상세정보에서 확인해요');
    expect(readableOpeningHours('24/7')).toBe('24시간 진료');
    expect(readableOpeningHours('Mo-Fr 09:00-18:00; Sa 09:00-13:00')).toContain(' · ');
  });

  it('turns a Korean location search response into a safe map center', () => {
    expect(parseLocationSearchResponse([{
      lat: '37.4979',
      lon: '127.0276',
      display_name: '강남역, 서울특별시, 대한민국',
      address: { suburb: '역삼동' },
    }])).toEqual({ latitude: 37.4979, longitude: 127.0276, label: '역삼동', precision: 'area' });
    expect(parseLocationSearchResponse([])).toBeUndefined();
    expect(parseLocationSearchResponse([{ lat: 'nope', lon: '127' }])).toBeUndefined();
  });

  it('prefers an exact road-name building number over a street-only result', () => {
    expect(parseLocationSearchResponse([
      { lat: '35.17', lon: '129.12', address: { road: '센텀중앙로' } },
      { lat: '35.1751', lon: '129.1248', address: { road: '센텀중앙로', house_number: '97' } },
    ], '부산 해운대구 센텀중앙로 97')).toEqual({
      latitude: 35.1751,
      longitude: 129.1248,
      label: '센텀중앙로 97',
      precision: 'address',
    });
  });

  it('reads an exact Korean road address from the fallback geocoder', () => {
    expect(parsePhotonLocationSearchResponse({
      features: [{
        properties: { countrycode: 'KR', street: '센텀중앙로', housenumber: '97', city: '부산광역시' },
        geometry: { coordinates: [129.1248645, 35.1751536] },
      }],
    }, '부산 해운대구 센텀중앙로 97')).toEqual({
      latitude: 35.1751536,
      longitude: 129.1248645,
      label: '센텀중앙로 97',
      precision: 'address',
    });
  });
});
