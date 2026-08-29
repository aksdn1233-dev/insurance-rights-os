export type HospitalPlace = {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  openingHours?: string;
  website?: string;
  imageUrl?: string;
  placeUrl: string;
  source: 'KAKAO' | 'OPENSTREETMAP';
};

export type MapConnectionStatus = 'loading' | 'kakao' | 'open' | 'location_denied' | 'error';

export type LocationSearchResult = {
  latitude: number;
  longitude: number;
  label: string;
};

export const DEFAULT_MAP_CENTER = {
  latitude: 37.5665,
  longitude: 126.978,
};

export function formatDistance(distanceMeters?: number) {
  if (distanceMeters === undefined || !Number.isFinite(distanceMeters)) return '거리 확인 중';
  if (distanceMeters < 1000) return `${Math.max(1, Math.round(distanceMeters))}m`;
  return `${(distanceMeters / 1000).toFixed(distanceMeters < 10000 ? 1 : 0)}km`;
}

export function normalizePhone(phone?: string) {
  const value = phone?.trim();
  return value || undefined;
}

export function phoneLink(phone?: string) {
  const normalized = normalizePhone(phone);
  return normalized ? `tel:${normalized.replace(/[^0-9+]/g, '')}` : undefined;
}

export function kakaoDirectionsUrl(place: Pick<HospitalPlace, 'id' | 'name' | 'latitude' | 'longitude' | 'source'>) {
  if (place.source === 'KAKAO' && /^\d+$/.test(place.id)) {
    return `https://map.kakao.com/link/to/${place.id}`;
  }
  return `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.latitude},${place.longitude}`;
}

export function kakaoRoadviewUrl(place: Pick<HospitalPlace, 'id' | 'latitude' | 'longitude' | 'source'>) {
  if (place.source === 'KAKAO' && /^\d+$/.test(place.id)) {
    return `https://map.kakao.com/link/roadview/${place.id}`;
  }
  return `https://map.kakao.com/link/roadview/${place.latitude},${place.longitude}`;
}

export function readableOpeningHours(openingHours?: string) {
  if (!openingHours) return '진료시간은 상세정보에서 확인해요';
  if (openingHours === '24/7') return '24시간 진료';
  return openingHours.replace(/;/g, ' · ');
}

export function parseLocationSearchResponse(payload: unknown): LocationSearchResult | undefined {
  if (!Array.isArray(payload)) return undefined;
  const first = payload[0] as Record<string, unknown> | undefined;
  if (!first) return undefined;
  const latitude = Number(first.lat);
  const longitude = Number(first.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  const address = first.address as Record<string, string> | undefined;
  const label =
    address?.suburb ||
    address?.borough ||
    address?.city_district ||
    address?.city ||
    String(first.display_name ?? '').split(',')[0] ||
    '선택한 위치';
  return { latitude, longitude, label };
}

export async function searchKoreanLocation(query: string): Promise<LocationSearchResult | undefined> {
  const params = new URLSearchParams({
    q: query.trim(),
    format: 'jsonv2',
    countrycodes: 'kr',
    addressdetails: '1',
    limit: '1',
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`LOCATION_SEARCH_${response.status}`);
    return parseLocationSearchResponse(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}
