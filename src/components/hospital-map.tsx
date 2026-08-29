'use dom';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { HospitalPlace, MapConnectionStatus } from '@/integrations/hospital-discovery';

type MapMode = 'roadmap' | 'skyview' | 'roadview';

type Props = {
  latitude: number;
  longitude: number;
  query: string;
  selectedId?: string;
  onResults: (places: HospitalPlace[]) => Promise<void>;
  onSelect: (place: HospitalPlace) => Promise<void>;
  onStatus: (status: MapConnectionStatus) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  dom?: import('expo/dom').DOMProps;
};

type MapEngine = {
  setMode: (mode: MapMode) => void;
  focus: (place: HospitalPlace) => void;
};

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY;

function loadScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const current = document.getElementById(id) as HTMLScriptElement | null;
    if (current?.dataset.loaded === 'true') return resolve();
    if (current) {
      current.addEventListener('load', () => resolve(), { once: true });
      current.addEventListener('error', () => reject(new Error(`LOAD_FAILED_${id}`)), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => reject(new Error(`LOAD_FAILED_${id}`)), { once: true });
    document.head.appendChild(script);
  });
}

function distanceBetween(latitude: number, longitude: number, otherLatitude: number, otherLongitude: number) {
  const earth = 6371000;
  const radians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = radians(otherLatitude - latitude);
  const deltaLng = radians(otherLongitude - longitude);
  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(latitude)) * Math.cos(radians(otherLatitude)) * Math.sin(deltaLng / 2) ** 2;
  return Math.round(earth * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
}

function safeRemoteImage(tags: Record<string, string>) {
  if (/^https:\/\//.test(tags.image ?? '')) return tags.image;
  if (tags.wikimedia_commons?.startsWith('File:')) {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(tags.wikimedia_commons.slice(5))}?width=900`;
  }
  return undefined;
}

function addressFromTags(tags: Record<string, string>) {
  if (tags['addr:full']) return tags['addr:full'];
  return [tags['addr:city'], tags['addr:district'], tags['addr:street'], tags['addr:housenumber']]
    .filter(Boolean)
    .join(' ') || '주소는 상세정보에서 확인해요';
}

function readableSpecialty(value?: string) {
  if (!value) return undefined;
  const labels: Record<string, string> = {
    internal: '내과',
    paediatrics: '소아청소년과',
    orthopaedics: '정형외과',
    ophthalmology: '안과',
    gynaecology: '산부인과',
    dermatology: '피부과',
    otolaryngology: '이비인후과',
    psychiatry: '정신건강의학과',
    rehabilitation: '재활의학과',
    plastic_surgery: '성형외과',
    general: '일반진료',
  };
  return value
    .split(';')
    .map((item) => labels[item] ?? item)
    .join(' · ');
}

async function fetchNominatimHospitals(latitude: number, longitude: number, query: string): Promise<HospitalPlace[]> {
  const params = new URLSearchParams({
    q: query.trim() ? `${query.trim()} 병원` : 'hospital',
    format: 'jsonv2',
    countrycodes: 'kr',
    viewbox: `${longitude - 0.07},${latitude + 0.05},${longitude + 0.07},${latitude - 0.05}`,
    bounded: '1',
    limit: '15',
    namedetails: '1',
    extratags: '1',
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`NOMINATIM_${response.status}`);
    const payload = await response.json() as Record<string, any>[];
    return payload.map((item) => {
      const lat = Number(item.lat);
      const lng = Number(item.lon);
      const tags = (item.extratags ?? {}) as Record<string, string>;
      const osmType = item.osm_type === 'relation' ? 'relation' : item.osm_type === 'node' ? 'node' : 'way';
      return {
        id: `${osmType}-${item.osm_id}`,
        name: item.namedetails?.['name:ko'] || item.namedetails?.name || item.display_name.split(',')[0],
        category: readableSpecialty(tags['healthcare:speciality']) || (item.type === 'hospital' ? '병원' : '의료기관'),
        address: item.display_name,
        phone: tags.phone || tags['contact:phone'],
        latitude: lat,
        longitude: lng,
        distanceMeters: distanceBetween(latitude, longitude, lat, lng),
        openingHours: tags.opening_hours,
        website: tags.website || tags['contact:website'],
        imageUrl: safeRemoteImage(tags),
        placeUrl: `https://www.openstreetmap.org/${osmType}/${item.osm_id}`,
        source: 'OPENSTREETMAP' as const,
      } satisfies HospitalPlace;
    }).sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchOpenHospitals(latitude: number, longitude: number, query: string): Promise<HospitalPlace[]> {
  const roundedLatitude = Number(latitude.toFixed(3));
  const roundedLongitude = Number(longitude.toFixed(3));
  const cacheKey = `nearby-hospitals:${roundedLatitude}:${roundedLongitude}`;
  let elements: Record<string, any>[] | undefined;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) elements = JSON.parse(cached) as Record<string, any>[];
  } catch {
    // A blocked browser cache should never prevent hospital search.
  }

  if (!elements) {
    const statement = `[out:json][timeout:12];(nwr["amenity"~"hospital|clinic|doctors"](around:5000,${roundedLatitude},${roundedLongitude}););out center tags 40;`;
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ];
    let lastError: unknown;
    for (const endpoint of endpoints) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(`${endpoint}?data=${encodeURIComponent(statement)}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`OVERPASS_${response.status}`);
        const payload = await response.json();
        elements = payload.elements as Record<string, any>[];
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(elements));
        } catch {
          // The result remains usable even when storage is unavailable.
        }
        break;
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timeout);
      }
    }
    if (!elements) {
      try {
        return await fetchNominatimHospitals(latitude, longitude, query);
      } catch {
        throw lastError ?? new Error('OPEN_MAP_SEARCH_UNAVAILABLE');
      }
    }
  }
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');

  return elements
    .map<HospitalPlace | null>((element) => {
      const tags = (element.tags ?? {}) as Record<string, string>;
      const lat = Number(element.lat ?? element.center?.lat);
      const lng = Number(element.lon ?? element.center?.lon);
      if (!tags.name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const searchText = `${tags.name} ${tags.healthcare ?? ''} ${tags['healthcare:speciality'] ?? ''}`.toLocaleLowerCase('ko-KR');
      if (normalizedQuery && !searchText.includes(normalizedQuery)) return null;
      const category = readableSpecialty(tags['healthcare:speciality']) ||
        ({ hospital: '병원', clinic: '의원', doctors: '의원' }[tags.amenity] ?? '의료기관');
      const place: HospitalPlace = {
        id: `${element.type}-${element.id}`,
        name: tags['name:ko'] || tags.name,
        category,
        address: addressFromTags(tags),
        phone: tags.phone || tags['contact:phone'],
        latitude: lat,
        longitude: lng,
        distanceMeters: distanceBetween(latitude, longitude, lat, lng),
        openingHours: tags.opening_hours,
        website: tags.website || tags['contact:website'],
        imageUrl: safeRemoteImage(tags),
        placeUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        source: 'OPENSTREETMAP' as const,
      };
      return place;
    })
    .filter((place): place is HospitalPlace => Boolean(place))
    .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity))
    .slice(0, 15);
}

function ensureLeafletStyle() {
  if (document.getElementById('leaflet-css')) return;
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

export default function HospitalMap({
  latitude,
  longitude,
  query,
  selectedId,
  onResults,
  onSelect,
  onStatus,
  openExternal,
}: Props) {
  const [mode, setMode] = useState<MapMode>('roadmap');
  const [provider, setProvider] = useState<'kakao' | 'open'>('open');
  const [message, setMessage] = useState('가까운 병원을 찾고 있어요');
  const engineRef = useRef<MapEngine | null>(null);
  const placesRef = useRef<HospitalPlace[]>([]);
  const selectedIdRef = useRef(selectedId);

  const center = useMemo(() => ({ latitude, longitude }), [latitude, longitude]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    let cancelled = false;
    const mapElement = document.getElementById('hospital-map');
    const roadviewElement = document.getElementById('hospital-roadview');
    if (!mapElement || !roadviewElement) return;
    const mapContainer = mapElement;
    const roadviewContainer = roadviewElement;
    mapContainer.innerHTML = '';
    roadviewContainer.innerHTML = '';
    void onStatus('loading');

    async function startKakao() {
      await loadScript(
        'kakao-maps-sdk',
        `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(KAKAO_KEY!)}&autoload=false&libraries=services,clusterer`
      );
      const kakao = (window as any).kakao;
      await new Promise<void>((resolve) => kakao.maps.load(resolve));
      if (cancelled) return;

      const position = new kakao.maps.LatLng(center.latitude, center.longitude);
      const map = new kakao.maps.Map(mapContainer, { center: position, level: 5 });
      const roadview = new kakao.maps.Roadview(roadviewContainer);
      const roadviewClient = new kakao.maps.RoadviewClient();
      const markers: any[] = [];

      function select(place: HospitalPlace) {
        map.panTo(new kakao.maps.LatLng(place.latitude, place.longitude));
        void onSelect(place);
      }

      function renderPlaces(raw: Record<string, string>[]) {
        markers.forEach((marker) => marker.setMap(null));
        const places = raw.map((item) => ({
          id: item.id,
          name: item.place_name,
          category: item.category_name?.split(' > ').at(-1) || '의료기관',
          address: item.road_address_name || item.address_name,
          phone: item.phone || undefined,
          latitude: Number(item.y),
          longitude: Number(item.x),
          distanceMeters: item.distance ? Number(item.distance) : undefined,
          placeUrl: item.place_url,
          source: 'KAKAO' as const,
        } satisfies HospitalPlace));
        placesRef.current = places;
        places.forEach((place) => {
          const marker = new kakao.maps.Marker({ position: new kakao.maps.LatLng(place.latitude, place.longitude), map });
          kakao.maps.event.addListener(marker, 'click', () => select(place));
          markers.push(marker);
        });
        void onResults(places);
        if (places[0]) void onSelect(places[0]);
        setMessage(places.length ? `가까운 병원 ${places.length}곳을 찾았어요` : '이 근처에서는 검색 결과를 찾지 못했어요');
      }

      const placesService = new kakao.maps.services.Places(map);
      const callback = (data: Record<string, string>[], status: string) => {
        if (status === kakao.maps.services.Status.OK) renderPlaces(data);
        else {
          void onResults([]);
          setMessage('검색 결과가 없어요. 진료과 이름을 바꿔 보세요');
        }
      };
      const options = { location: position, radius: 5000, sort: kakao.maps.services.SortBy.DISTANCE, size: 15 };
      if (query.trim()) placesService.keywordSearch(`${query.trim()} 병원`, callback, options);
      else placesService.categorySearch('HP8', callback, options);

      engineRef.current = {
        setMode(nextMode) {
          if (nextMode === 'roadmap') {
            roadviewContainer.style.display = 'none';
            mapContainer.style.display = 'block';
            map.setMapTypeId(kakao.maps.MapTypeId.ROADMAP);
          } else if (nextMode === 'skyview') {
            roadviewContainer.style.display = 'none';
            mapContainer.style.display = 'block';
            map.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
          } else {
            const selected = placesRef.current.find((place) => place.id === selectedIdRef.current) ?? placesRef.current[0];
            if (!selected) return;
            const target = new kakao.maps.LatLng(selected.latitude, selected.longitude);
            roadviewClient.getNearestPanoId(target, 100, (panoId: number | null) => {
              if (!panoId) {
                setMessage('이 병원 주변에는 로드뷰 촬영 지점이 없어요');
                return;
              }
              mapContainer.style.display = 'none';
              roadviewContainer.style.display = 'block';
              roadview.setPanoId(panoId, target);
            });
          }
        },
        focus(place) {
          select(place);
        },
      };
      setProvider('kakao');
      void onStatus('kakao');
    }

    async function startOpenMap() {
      ensureLeafletStyle();
      await loadScript('leaflet-sdk', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
      if (cancelled) return;
      const leaflet = (window as any).L;
      const map = leaflet.map(mapContainer, { zoomControl: false, attributionControl: true }).setView(
        [center.latitude, center.longitude],
        14
      );
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);
      leaflet.control.zoom({ position: 'bottomright' }).addTo(map);
      const currentIcon = leaflet.divIcon({ className: 'current-marker', html: '<span></span>', iconSize: [20, 20] });
      leaflet.marker([center.latitude, center.longitude], { icon: currentIcon }).addTo(map);

      const places = await fetchOpenHospitals(center.latitude, center.longitude, query);
      if (cancelled) return;
      placesRef.current = places;
      const hospitalIcon = leaflet.divIcon({ className: 'hospital-marker', html: '<span>+</span>', iconSize: [34, 34], iconAnchor: [17, 17] });
      places.forEach((place) => {
        leaflet.marker([place.latitude, place.longitude], { icon: hospitalIcon })
          .addTo(map)
          .bindTooltip(place.name, { direction: 'top', offset: [0, -17] })
          .on('click', () => void onSelect(place));
      });
      void onResults(places);
      if (places[0]) void onSelect(places[0]);
      setMessage(places.length ? `가까운 병원 ${places.length}곳을 찾았어요` : '이 근처의 공개 병원 정보가 아직 적어요');
      setProvider('open');
      void onStatus('open');
      engineRef.current = {
        setMode(nextMode) {
          if (nextMode === 'roadview') {
            const selected = placesRef.current.find((place) => place.id === selectedIdRef.current) ?? placesRef.current[0];
            if (selected) void openExternal(`https://map.kakao.com/link/roadview/${selected.latitude},${selected.longitude}`);
          } else if (nextMode === 'skyview') {
            void openExternal(`https://map.kakao.com/link/map/${center.latitude},${center.longitude}`);
          }
        },
        focus(place) {
          map.flyTo([place.latitude, place.longitude], 16, { duration: 0.5 });
        },
      };
    }

    (async () => {
      try {
        if (KAKAO_KEY) await startKakao();
        else await startOpenMap();
      } catch {
        if (!cancelled && KAKAO_KEY) {
          try {
            mapContainer.innerHTML = '';
            await startOpenMap();
            setMessage('카카오 연결이 늦어 공개 지도로 보여드려요');
          } catch {
            void onStatus('error');
            setMessage('지도를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요');
          }
        } else if (!cancelled) {
          void onStatus('error');
          setMessage('지도를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요');
        }
      }
    })();

    return () => {
      cancelled = true;
      engineRef.current = null;
      mapContainer.innerHTML = '';
      roadviewContainer.innerHTML = '';
    };
  }, [center.latitude, center.longitude, onResults, onSelect, onStatus, openExternal, query]);

  useEffect(() => {
    engineRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    const selected = placesRef.current.find((place) => place.id === selectedId);
    if (selected) engineRef.current?.focus(selected);
  }, [selectedId]);

  return (
    <div className="map-shell">
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { width: 100%; height: 100%; margin: 0; overflow: hidden; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        button { font: inherit; }
        .map-shell { position: relative; width: 100%; height: 100%; background: #edf1f4; overflow: hidden; }
        #hospital-map, #hospital-roadview { position: absolute; inset: 0; width: 100%; height: 100%; }
        #hospital-roadview { display: none; }
        .mode-switch { position: absolute; z-index: 900; top: 12px; left: 12px; display: flex; gap: 3px; padding: 4px; border-radius: 14px; background: rgba(255,255,255,.96); box-shadow: 0 3px 14px rgba(25,31,40,.14); }
        .mode-button { border: 0; border-radius: 10px; padding: 9px 11px; color: #6b7684; background: transparent; font-size: 12px; font-weight: 750; cursor: pointer; }
        .mode-button.active { color: #fff; background: #3182f6; }
        .status { position: absolute; z-index: 900; left: 12px; bottom: 12px; max-width: calc(100% - 74px); padding: 9px 12px; border-radius: 12px; background: rgba(25,31,40,.84); color: white; font-size: 12px; line-height: 17px; backdrop-filter: blur(5px); }
        .provider { color: #b9d9ff; margin-left: 5px; }
        .current-marker span { display: block; width: 18px; height: 18px; border: 4px solid #fff; border-radius: 50%; background: #3182f6; box-shadow: 0 2px 9px rgba(49,130,246,.5); }
        .hospital-marker { border: 0; background: transparent; }
        .hospital-marker span { display: flex; width: 34px; height: 34px; align-items: center; justify-content: center; border: 3px solid #fff; border-radius: 12px; background: #3182f6; box-shadow: 0 3px 10px rgba(25,31,40,.22); color: #fff; font-size: 21px; font-weight: 700; }
        .leaflet-control-attribution { font-size: 8px !important; }
      `}</style>
      <div id="hospital-map" aria-label="가까운 병원 지도" />
      <div id="hospital-roadview" aria-label="선택한 병원 주변 로드뷰" />
      <div className="mode-switch" aria-label="지도 보기 방식">
        <button className={`mode-button ${mode === 'roadmap' ? 'active' : ''}`} onClick={() => setMode('roadmap')}>지도</button>
        <button className={`mode-button ${mode === 'skyview' ? 'active' : ''}`} onClick={() => setMode('skyview')}>스카이뷰</button>
        <button className={`mode-button ${mode === 'roadview' ? 'active' : ''}`} onClick={() => setMode('roadview')}>로드뷰</button>
      </div>
      <div className="status" aria-live="polite">
        {message}<span className="provider">{provider === 'kakao' ? '카카오맵' : '공개 지도'}</span>
      </div>
    </div>
  );
}
