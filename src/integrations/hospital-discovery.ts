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
  entityType?: 'hospital' | 'insurer';
  companyId?: string;
  officialSourceUrl?: string;
};

export type MapLayer = 'hospital' | 'insurance';

export type MapConnectionStatus = 'loading' | 'kakao' | 'open' | 'location_denied' | 'error';

export type LocationSearchResult = {
  latitude: number;
  longitude: number;
  label: string;
  precision?: 'address' | 'area';
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

function expectedHouseNumber(query: string) {
  return query.trim().match(/(?:^|\s)(\d+(?:-\d+)?)\s*$/)?.[1];
}

function normalizeHouseNumber(value: unknown) {
  return String(value ?? '').replace(/\s/g, '');
}

export function parseLocationSearchResponse(payload: unknown, query = ''): LocationSearchResult | undefined {
  if (!Array.isArray(payload)) return undefined;
  const requestedNumber = expectedHouseNumber(query);
  const first = (requestedNumber
    ? payload.find((item) => {
      const address = (item as Record<string, unknown>)?.address as Record<string, unknown> | undefined;
      return normalizeHouseNumber(address?.house_number) === requestedNumber;
    }) ?? payload[0]
    : payload[0]) as Record<string, unknown> | undefined;
  if (!first) return undefined;
  const latitude = Number(first.lat);
  const longitude = Number(first.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  const address = first.address as Record<string, string> | undefined;
  const houseNumber = normalizeHouseNumber(address?.house_number);
  const road = address?.road || address?.pedestrian || address?.footway;
  const label =
    (road && houseNumber ? `${road} ${houseNumber}` : undefined) ||
    address?.suburb ||
    address?.borough ||
    address?.city_district ||
    address?.city ||
    String(first.display_name ?? '').split(',')[0] ||
    '선택한 위치';
  return {
    latitude,
    longitude,
    label,
    precision: requestedNumber && houseNumber === requestedNumber ? 'address' : 'area',
  };
}

export function parsePhotonLocationSearchResponse(payload: unknown, query = ''): LocationSearchResult | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const features = (payload as { features?: unknown }).features;
  if (!Array.isArray(features)) return undefined;
  const requestedNumber = expectedHouseNumber(query);
  const feature = (requestedNumber
    ? features.find((item) => {
      const properties = (item as Record<string, unknown>)?.properties as Record<string, unknown> | undefined;
      return normalizeHouseNumber(properties?.housenumber) === requestedNumber;
    }) ?? features[0]
    : features[0]) as Record<string, unknown> | undefined;
  if (!feature) return undefined;
  const geometry = feature.geometry as { coordinates?: unknown } | undefined;
  const coordinates = geometry?.coordinates;
  if (!Array.isArray(coordinates)) return undefined;
  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  const properties = feature.properties as Record<string, unknown> | undefined;
  if (String(properties?.countrycode ?? '').toUpperCase() !== 'KR') return undefined;
  const houseNumber = normalizeHouseNumber(properties?.housenumber);
  const road = String(properties?.street ?? '').trim();
  const label =
    (road && houseNumber ? `${road} ${houseNumber}` : undefined) ||
    String(properties?.name ?? properties?.district ?? properties?.city ?? '선택한 위치');
  return {
    latitude,
    longitude,
    label,
    precision: requestedNumber && houseNumber === requestedNumber ? 'address' : 'area',
  };
}

export async function searchKoreanLocation(query: string): Promise<LocationSearchResult | undefined> {
  const normalizedQuery = query.trim().replace(/\s+/g, ' ');
  const params = new URLSearchParams({
    q: normalizedQuery,
    format: 'jsonv2',
    countrycodes: 'kr',
    addressdetails: '1',
    limit: '5',
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    let openStreetMapResult: LocationSearchResult | undefined;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (response.ok) openStreetMapResult = parseLocationSearchResponse(await response.json(), normalizedQuery);
    } catch {
      // A second public geocoder below keeps address search usable when one provider is unavailable.
    }

    const needsAddressFallback = Boolean(expectedHouseNumber(normalizedQuery)) && openStreetMapResult?.precision !== 'address';
    if (!openStreetMapResult || needsAddressFallback) {
      const photonParams = new URLSearchParams({ q: normalizedQuery, limit: '5' });
      const response = await fetch(`https://photon.komoot.io/api/?${photonParams.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const photonResult = parsePhotonLocationSearchResponse(await response.json(), normalizedQuery);
        if (photonResult?.precision === 'address' || !openStreetMapResult) return photonResult;
      }
    }
    return openStreetMapResult;
  } finally {
    clearTimeout(timeout);
  }
}
