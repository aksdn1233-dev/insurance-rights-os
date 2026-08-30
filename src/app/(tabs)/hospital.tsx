import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import HospitalMap from '@/components/hospital-map';
import { Eyebrow, Page, SectionHeader, StatusPill, Surface, TextButton, Title } from '@/components/product-ui';
import { palette, space, type } from '@/constants/product-theme';
import { getWebPosition, isPermissionDeniedError, SimplePosition, withTimeout } from '@/integrations/device-location';
import {
  filterInsuranceCompanies,
  InsuranceCompanyType,
  LIFE_ASSOCIATION_SOURCE,
  NON_LIFE_ASSOCIATION_SOURCE,
} from '@/integrations/insurance-company-directory';
import {
  DEFAULT_MAP_CENTER,
  formatDistance,
  HospitalPlace,
  kakaoDirectionsUrl,
  kakaoRoadviewUrl,
  MapConnectionStatus,
  MapLayer,
  phoneLink,
  readableOpeningHours,
  searchKoreanLocation,
} from '@/integrations/hospital-discovery';
import { officialServices, openOfficialService } from '@/integrations/official-services';

const hospitalQuickSearches = ['내과', '소아청소년과', '정형외과', '산부인과'];
const insuranceQuickSearches = ['삼성', '현대', 'DB', 'KB'];
type LocationState = 'checking' | 'prompt' | 'requesting' | 'ready' | 'manual' | 'denied' | 'unavailable';

async function openTrustedUrl(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  } catch {
    await Linking.openURL(url);
  }
}

export default function HospitalScreen() {
  const [layer, setLayer] = useState<MapLayer>('hospital');
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [places, setPlaces] = useState<HospitalPlace[]>([]);
  const [selected, setSelected] = useState<HospitalPlace>();
  const [mapStatus, setMapStatus] = useState<MapConnectionStatus>('loading');
  const [location, setLocation] = useState(DEFAULT_MAP_CENTER);
  const [locationState, setLocationState] = useState<LocationState>('checking');
  const [locationLabel, setLocationLabel] = useState('서울 시청');
  const [areaQuery, setAreaQuery] = useState('');
  const [areaState, setAreaState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [failedImageId, setFailedImageId] = useState<string>();
  const [directoryType, setDirectoryType] = useState<InsuranceCompanyType>('life');
  const [showAllCompanies, setShowAllCompanies] = useState(false);

  const isInsurance = layer === 'insurance';
  const quickSearches = isInsurance ? insuranceQuickSearches : hospitalQuickSearches;
  const companyDirectory = useMemo(
    () => filterInsuranceCompanies('', directoryType),
    [directoryType]
  );
  const visibleCompanies = showAllCompanies ? companyDirectory : companyDirectory.slice(0, 8);

  const applyPosition = useCallback((position: SimplePosition) => {
    setLocation(position);
    setLocationLabel('내 위치');
    setLocationState('ready');
    setPlaces([]);
    setSelected(undefined);
    setMapStatus('loading');
  }, []);

  const loadGrantedLocation = useCallback(async () => {
    setLocationState('requesting');
    let hasLastKnown = false;
    try {
      if (Platform.OS === 'web') {
        applyPosition(await getWebPosition());
        return;
      }
      const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 300000, requiredAccuracy: 1000 });
      if (lastKnown) {
        hasLastKnown = true;
        applyPosition({ latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude });
      }
      const current = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        12000
      );
      applyPosition({ latitude: current.coords.latitude, longitude: current.coords.longitude });
    } catch {
      if (!hasLastKnown) setLocationState('unavailable');
    }
  }, [applyPosition]);

  const requestMyLocation = useCallback(async () => {
    setLocationState('requesting');
    try {
      if (Platform.OS === 'web') {
        applyPosition(await getWebPosition());
        return;
      }
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationState('unavailable');
        return;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationState('denied');
        return;
      }
      await loadGrantedLocation();
    } catch (error) {
      setLocationState(isPermissionDeniedError(error) ? 'denied' : 'unavailable');
    }
  }, [applyPosition, loadGrantedLocation]);

  const checkLocationPermission = useCallback(async () => {
    setLocationState('checking');
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          setLocationState('unavailable');
          return;
        }
        if (!navigator.permissions?.query) {
          setLocationState('prompt');
          return;
        }
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') await loadGrantedLocation();
        else setLocationState(permission.state === 'denied' ? 'denied' : 'prompt');
        return;
      }
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationState('unavailable');
        return;
      }
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status === Location.PermissionStatus.GRANTED) await loadGrantedLocation();
      else setLocationState(permission.status === Location.PermissionStatus.DENIED ? 'denied' : 'prompt');
    } catch {
      setLocationState('prompt');
    }
  }, [loadGrantedLocation]);

  const moveToArea = async () => {
    if (!areaQuery.trim()) return;
    setAreaState('loading');
    try {
      const result = await searchKoreanLocation(areaQuery);
      if (!result) {
        setAreaState('error');
        return;
      }
      setLocation({ latitude: result.latitude, longitude: result.longitude });
      setLocationLabel(result.label);
      setLocationState('manual');
      setPlaces([]);
      setSelected(undefined);
      setMapStatus('loading');
      setAreaState('idle');
    } catch {
      setAreaState('error');
    }
  };

  useEffect(() => {
    const task = setTimeout(() => void checkLocationPermission(), 0);
    return () => clearTimeout(task);
  }, [checkLocationPermission]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') return;
    const refreshPermission = () => {
      if (document.visibilityState !== 'hidden') void checkLocationPermission();
    };
    window.addEventListener('focus', refreshPermission);
    document.addEventListener('visibilitychange', refreshPermission);
    return () => {
      window.removeEventListener('focus', refreshPermission);
      document.removeEventListener('visibilitychange', refreshPermission);
    };
  }, [checkLocationPermission]);

  const receiveResults = useCallback(async (nextPlaces: HospitalPlace[]) => {
    setPlaces(nextPlaces);
    setSelected((current) => nextPlaces.find((place) => place.id === current?.id) ?? nextPlaces[0]);
  }, []);
  const selectPlace = useCallback(async (place: HospitalPlace) => setSelected(place), []);
  const updateMapStatus = useCallback(async (status: MapConnectionStatus) => setMapStatus(status), []);
  const openExternal = useCallback(async (url: string) => openTrustedUrl(url), []);

  const submitSearch = (value = query) => {
    const next = value.trim();
    setQuery(next);
    setActiveQuery(next);
  };

  const changeLayer = (nextLayer: MapLayer) => {
    if (nextLayer === layer) return;
    setLayer(nextLayer);
    setQuery('');
    setActiveQuery('');
    setPlaces([]);
    setSelected(undefined);
    setFailedImageId(undefined);
  };

  const callSelected = async () => {
    const url = phoneLink(selected?.phone);
    if (url) await Linking.openURL(url);
  };

  return (
    <Page contentStyle={styles.page}>
      <View style={styles.header}>
        <Eyebrow>{isInsurance ? '보험사 찾기' : '가까운 병원'}</Eyebrow>
        <Title>{isInsurance ? <>보험사 위치와 연락처를{`\n`}한 번에 찾아요.</> : <>어디로 가야 할지{`\n`}지도에서 바로 봐요.</>}</Title>
        <Text style={styles.copy}>{isInsurance ? '가까운 지점과 공식 고객센터 번호를 같이 보여드려요.' : '진료과를 먼저 맞추고, 가까운 순서로 보여드려요.'}</Text>
      </View>

      <View style={styles.layerSwitch} accessibilityRole="tablist">
        <LayerButton label="병원 찾기" active={!isInsurance} onPress={() => changeLayer('hospital')} />
        <LayerButton label="보험사 찾기" active={isInsurance} onPress={() => changeLayer('insurance')} />
      </View>

      <View style={styles.searchArea}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel={isInsurance ? '보험사 이름' : '진료과나 병원 이름'}
            autoCapitalize="none"
            enterKeyHint="search"
            placeholder={isInsurance ? '예: 삼성화재, 교보생명' : '예: 내과, 정형외과, 병원 이름'}
            placeholderTextColor={palette.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => submitSearch()}
            style={styles.searchInput}
          />
          {query ? <TextButton label="찾기" onPress={() => submitSearch()} /> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {quickSearches.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => submitSearch(item)}
              style={({ pressed }) => [
                styles.quickChip,
                activeQuery === item && styles.quickChipActive,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.quickText, activeQuery === item && styles.quickTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.mapSection}>
        <View style={styles.mapTopLine}>
          <View style={styles.locationLine}>
            {locationState === 'checking' || locationState === 'requesting' ? <ActivityIndicator size="small" color={palette.brand} /> : <View style={styles.locationDot} />}
            <Text style={styles.locationText}>
              {locationState === 'ready'
                ? '현재 위치 주변'
                : locationState === 'manual'
                  ? `${locationLabel} 주변 · 직접 선택`
                  : locationState === 'denied'
                    ? Platform.OS === 'web'
                      ? '브라우저에서 위치를 차단했어요'
                      : '위치 권한이 꺼져 있어요'
                    : locationState === 'unavailable'
                      ? '현재 위치를 찾지 못했어요'
                      : locationState === 'prompt'
                        ? '내 위치를 사용하면 더 정확해요'
                        : locationState === 'requesting'
                          ? '현재 위치를 찾고 있어요'
                          : '위치 권한 확인 중'}
            </Text>
          </View>
          {locationState === 'prompt' || locationState === 'denied' || locationState === 'unavailable' || locationState === 'manual' ? (
            <TextButton
              label={locationState === 'prompt' ? '내 위치 사용' : locationState === 'unavailable' ? '다시 시도' : locationState === 'manual' ? '내 위치로 찾기' : Platform.OS === 'web' ? '권한 다시 확인' : '설정 열기'}
              onPress={() => {
                if (locationState === 'denied' && Platform.OS !== 'web') void Linking.openSettings();
                else if (locationState === 'denied') void checkLocationPermission();
                else void requestMyLocation();
              }}
            />
          ) : null}
        </View>
        {locationState === 'prompt' || locationState === 'denied' || locationState === 'unavailable' || locationState === 'manual' ? (
          <View style={styles.locationHelp}>
            <Text style={styles.locationHelpTitle}>
              {locationState === 'prompt'
                ? '내 위치를 쓰면 가까운 순서로 보여드려요'
                : locationState === 'manual'
                  ? '다른 주소도 바로 찾을 수 있어요'
                  : '주소나 동네로 바로 찾을 수 있어요'}
            </Text>
            <Text style={styles.locationHelpCopy}>
              {locationState === 'prompt'
                ? '‘내 위치 사용’을 누르면 위치 권한을 물어봐요.'
                : locationState === 'denied'
                  ? '위치 권한을 허용하거나 도로명과 건물번호를 써 주세요.'
                  : '도로명과 건물번호, 역 또는 동네 이름을 써 주세요.'}
            </Text>
            <View style={styles.areaSearchRow}>
              <TextInput
                accessibilityLabel="찾을 주소, 동네 또는 역"
                enterKeyHint="search"
                placeholder="예: 테헤란로 152, 강남역"
                placeholderTextColor={palette.muted}
                value={areaQuery}
                onChangeText={(value) => {
                  setAreaQuery(value);
                  if (areaState === 'error') setAreaState('idle');
                }}
                onSubmitEditing={() => void moveToArea()}
                style={styles.areaInput}
              />
              <Pressable
                accessibilityRole="button"
                disabled={!areaQuery.trim() || areaState === 'loading'}
                onPress={() => void moveToArea()}
                style={({ pressed }) => [styles.areaButton, (!areaQuery.trim() || areaState === 'loading') && styles.actionDisabled, pressed && styles.pressed]}>
                {areaState === 'loading' ? <ActivityIndicator size="small" color={palette.white} /> : <Text style={styles.areaButtonText}>이동</Text>}
              </Pressable>
            </View>
            {areaState === 'error' ? <Text style={styles.areaError}>주소를 찾지 못했어요. 시·군·구와 도로명, 건물번호를 함께 써 주세요.</Text> : null}
            <Text style={styles.locationPermissionTip}>
              {locationState === 'denied'
                ? Platform.OS === 'web'
                  ? '주소창의 사이트 설정 → 위치 → 허용으로 바꿔 주세요. 이 화면으로 돌아오면 자동으로 다시 확인해요.'
                  : '휴대폰 설정에서 이 앱의 위치 권한을 ‘앱을 사용하는 동안’으로 바꿔 주세요.'
                : '주소와 위치는 주변 검색에만 쓰고 앱 서버에는 저장하지 않아요.'}
            </Text>
          </View>
        ) : null}
        <View style={styles.mapFrame}>
          <HospitalMap
            latitude={location.latitude}
            longitude={location.longitude}
            layer={layer}
            query={activeQuery}
            selectedId={selected?.id}
            onResults={receiveResults}
            onSelect={selectPlace}
            onStatus={updateMapStatus}
            openExternal={openExternal}
            dom={{ scrollEnabled: false, style: { height: 390 }, containerStyle: { height: 390 } }}
          />
        </View>
        <Text style={styles.sourceText}>
          {mapStatus === 'kakao'
            ? `카카오맵 장소 정보 · ${isInsurance ? '지점 운영시간과 전화번호' : '사진과 진료시간'}은 상세에서 최신 내용을 확인해요.`
            : mapStatus === 'open'
              ? `OpenStreetMap 공개 정보 · ${isInsurance ? '지점 위치는 보험사 공식 홈페이지에서도 확인해 주세요.' : '병원에서 올린 정보와 다를 수 있어 전화 확인이 필요해요.'}`
              : mapStatus === 'error'
                ? isInsurance ? '지도를 불러오지 못했어요. 아래 공식 고객센터는 바로 이용할 수 있어요.' : '지도를 불러오지 못했어요. 공식 건강지도에서 다시 확인할 수 있어요.'
                : `지도와 ${isInsurance ? '보험사' : '병원'} 정보를 불러오는 중이에요.`}
        </Text>
        <Text style={styles.privacyText}>주변 검색을 위해 지도 제공사에 지도 중심 좌표를 보내며, 앱 서버에는 위치를 저장하지 않아요.</Text>
      </View>

      {places.length ? (
        <View style={styles.resultsSection}>
          <SectionHeader title={`${activeQuery || (isInsurance ? '가까운 보험사' : '가까운 병원')} ${places.length}곳`} description="목록을 누르면 지도와 상세정보가 함께 움직여요." />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.resultRow}>
            {places.map((place) => (
              <Pressable
                key={place.id}
                accessibilityRole="button"
                accessibilityLabel={`${place.name}, ${formatDistance(place.distanceMeters)}`}
                onPress={() => setSelected(place)}
                style={({ pressed }) => [
                  styles.resultItem,
                  selected?.id === place.id && styles.resultItemActive,
                  pressed && styles.pressed,
                ]}>
                <Text numberOfLines={1} style={styles.resultName}>{place.name}</Text>
                <Text numberOfLines={1} style={styles.resultDetail}>{place.category} · {formatDistance(place.distanceMeters)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {selected ? (
        <View style={styles.detailSection}>
          <View style={styles.detailHeading}>
            <View style={styles.detailTitleWrap}>
              <Text style={styles.hospitalName}>{selected.name}</Text>
              <Text style={styles.category}>{selected.category}</Text>
            </View>
            <StatusPill tone="brand">{formatDistance(selected.distanceMeters)}</StatusPill>
          </View>

          {selected.imageUrl && failedImageId !== selected.id ? (
            <Image
              accessibilityLabel={`${selected.name} 공개 사진`}
              source={{ uri: selected.imageUrl }}
              resizeMode="cover"
              style={styles.photo}
              onError={() => setFailedImageId(selected.id)}
            />
          ) : (
            <Pressable
              accessibilityRole="link"
              onPress={() => void openTrustedUrl(selected.placeUrl)}
              style={({ pressed }) => [styles.photoFallback, pressed && styles.pressed]}>
              <View style={[styles.photoSymbol, isInsurance && styles.insuranceSymbol]}><Text style={[styles.photoSymbolText, isInsurance && styles.insuranceSymbolText]}>{isInsurance ? '보험' : '＋'}</Text></View>
              <View style={styles.photoCopy}>
                <Text style={styles.photoTitle}>{isInsurance ? '지점 위치 자세히 보기' : '병원 사진 보기'}</Text>
                <Text style={styles.photoDetail}>{isInsurance ? '지도에 공개된 지점 정보를 확인해요' : '인터넷에 공개된 사진을 상세정보에서 확인해요'}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}

          <Surface style={styles.infoSurface}>
            <InfoLine label="주소" value={selected.address} />
            <InfoLine label={isInsurance ? '고객센터' : '전화'} value={selected.phone || '등록된 전화번호가 없어요'} />
            <InfoLine label={isInsurance ? '상담시간' : '진료시간'} value={isInsurance ? (selected.openingHours?.replace(/;/g, ' · ') || '상담시간은 공식 홈페이지에서 확인해요') : readableOpeningHours(selected.openingHours)} last />
          </Surface>

          <View style={styles.actionGrid}>
            <HospitalAction label="전화하기" disabled={!selected.phone} onPress={() => void callSelected()} />
            <HospitalAction label="길찾기" onPress={() => void openTrustedUrl(kakaoDirectionsUrl(selected))} />
            <HospitalAction label="로드뷰" onPress={() => void openTrustedUrl(kakaoRoadviewUrl(selected))} />
            <HospitalAction label={isInsurance ? '위치 상세' : '사진·시간 보기'} onPress={() => void openTrustedUrl(selected.placeUrl)} />
          </View>
          {selected.website ? (
            <Pressable accessibilityRole="link" onPress={() => void openTrustedUrl(selected.website!)} style={styles.websiteLink}>
              <Text style={styles.websiteText}>{isInsurance ? '보험사 공식 홈페이지' : '병원 홈페이지 보기'}</Text>
              <Text style={styles.websiteArrow}>›</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {isInsurance ? (
        <View style={styles.directorySection}>
          <SectionHeader title="보험사 고객센터 한눈에" description="대표번호를 누르면 바로 전화할 수 있어요." />
          <View style={styles.directorySwitch}>
            <DirectoryTypeButton label="생명보험" active={directoryType === 'life'} onPress={() => { setDirectoryType('life'); setShowAllCompanies(false); }} />
            <DirectoryTypeButton label="손해보험" active={directoryType === 'non_life'} onPress={() => { setDirectoryType('non_life'); setShowAllCompanies(false); }} />
          </View>
          <Surface style={styles.directorySurface}>
            {visibleCompanies.map((company, index) => (
              <View key={company.id} style={[styles.companyRow, index < visibleCompanies.length - 1 && styles.companyBorder]}>
                <Pressable accessibilityRole="link" onPress={() => void openTrustedUrl(company.website)} style={({ pressed }) => [styles.companyCopy, pressed && styles.pressed]}>
                  <Text style={styles.companyName}>{company.name}</Text>
                  <Text style={styles.companyPhone}>{company.customerCenter}</Text>
                  {company.hours ? <Text style={styles.companyHours}>{company.hours}</Text> : null}
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`${company.name} 고객센터 전화하기`} onPress={() => void Linking.openURL(phoneLink(company.customerCenter)!)} style={({ pressed }) => [styles.callButton, pressed && styles.pressed]}>
                  <Text style={styles.callButtonText}>전화</Text>
                </Pressable>
              </View>
            ))}
          </Surface>
          <Pressable accessibilityRole="button" onPress={() => setShowAllCompanies((current) => !current)} style={({ pressed }) => [styles.showAllButton, pressed && styles.pressed]}>
            <Text style={styles.showAllText}>{showAllCompanies ? '간단히 보기' : `전체 ${companyDirectory.length}개 보험사 보기`}</Text>
          </Pressable>
          <Text style={styles.directoryNote}>2026년 8월 29일 공식 협회·보험사 페이지 기준이에요. 연결 전 화면에 표시된 보험사 이름을 한 번 확인해 주세요.</Text>
        </View>
      ) : null}

      <View style={styles.officialSection}>
        <SectionHeader title="한 번 더 공식 정보로 확인" description={isInsurance ? '대표번호와 회사 이름은 바뀔 수 있어요.' : '운영시간과 진료과는 바뀔 수 있어요.'} />
        {isInsurance ? (
          <>
            <OfficialLink title="생명보험협회 회원사 정보" detail="생명보험사 주소·홈페이지·고객센터를 확인해요." onPress={() => void openTrustedUrl(LIFE_ASSOCIATION_SOURCE)} />
            <OfficialLink title="손해보험협회 고객센터 정보" detail="손해보험사 대표번호를 공식 목록에서 확인해요." onPress={() => void openTrustedUrl(NON_LIFE_ASSOCIATION_SOURCE)} />
          </>
        ) : (
          <OfficialLink title={officialServices['hira-map'].title} detail="심평원 건강지도에서 진료과와 병원 정보를 확인해요." onPress={() => void openOfficialService('hira-map')} />
        )}
      </View>

      <Text style={styles.boundary}>{isInsurance ? '지도에 없는 지점이 있을 수 있어요. 보험 계약·청구 상담은 가입한 보험사의 공식 고객센터에서 확인해 주세요.' : '의료적으로 맞는 진료과를 먼저 찾고 그다음 거리를 봐요. 보험금이 많이 나온다는 이유로 병원을 추천하지 않아요.'}</Text>
    </Page>
  );
}

function InfoLine({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoLine, !last && styles.infoBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function HospitalAction({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.action, disabled && styles.actionDisabled, pressed && !disabled && styles.pressed]}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function LayerButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.layerButton, active && styles.layerButtonActive, pressed && styles.pressed]}>
      <Text style={[styles.layerButtonText, active && styles.layerButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function DirectoryTypeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.directoryTypeButton, active && styles.directoryTypeButtonActive, pressed && styles.pressed]}>
      <Text style={[styles.directoryTypeText, active && styles.directoryTypeTextActive]}>{label}</Text>
    </Pressable>
  );
}

function OfficialLink({ title, detail, onPress }: { title: string; detail: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.officialRow, pressed && styles.pressed]}>
      <View style={styles.officialCopy}>
        <Text style={styles.officialTitle}>{title}</Text>
        <Text style={styles.officialDetail}>{detail}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 0, paddingTop: space.xl },
  header: { gap: space.md, paddingHorizontal: space.xl },
  copy: { ...type.body, color: palette.muted },
  layerSwitch: { marginHorizontal: space.xl, padding: 4, borderRadius: 18, backgroundColor: palette.infoSoft, flexDirection: 'row', gap: 4 },
  layerButton: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  layerButtonActive: { backgroundColor: palette.surface, shadowColor: '#191F28', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  layerButtonText: { ...type.bodyStrong, color: palette.muted },
  layerButtonTextActive: { color: palette.ink },
  searchArea: { gap: space.md, paddingHorizontal: space.xl },
  searchBar: {
    minHeight: 58,
    paddingHorizontal: space.lg,
    borderRadius: 18,
    backgroundColor: palette.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  searchIcon: { color: palette.ink, fontSize: 25, lineHeight: 28, transform: [{ rotate: '-15deg' }] },
  searchInput: { flex: 1, minWidth: 0, ...type.body, color: palette.ink, outlineStyle: 'none' } as any,
  quickRow: { gap: space.sm },
  quickChip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 999, backgroundColor: palette.surface },
  quickChipActive: { backgroundColor: palette.ink },
  quickText: { ...type.caption, color: palette.info },
  quickTextActive: { color: palette.white },
  mapSection: { gap: space.md },
  mapTopLine: { minHeight: 28, paddingHorizontal: space.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  locationDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.brand },
  locationText: { ...type.caption, color: palette.info },
  locationHelp: { marginHorizontal: space.xl, padding: space.lg, gap: space.sm, borderRadius: 20, backgroundColor: palette.brandSoft },
  locationHelpTitle: { ...type.bodyStrong, color: palette.ink },
  locationHelpCopy: { ...type.caption, color: palette.muted },
  areaSearchRow: { flexDirection: 'row', gap: space.sm, marginTop: 4 },
  areaInput: { flex: 1, minWidth: 0, minHeight: 50, paddingHorizontal: 14, borderRadius: 15, backgroundColor: palette.surface, ...type.body, color: palette.ink, outlineStyle: 'none' } as any,
  areaButton: { width: 66, minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand },
  areaButtonText: { ...type.bodyStrong, color: palette.white },
  areaError: { ...type.caption, color: palette.danger },
  locationPermissionTip: { fontSize: 11, lineHeight: 16, color: palette.muted },
  mapFrame: { height: 390, overflow: 'hidden', backgroundColor: '#EDF1F4' },
  sourceText: { ...type.caption, color: palette.muted, paddingHorizontal: space.xl },
  privacyText: { fontSize: 11, lineHeight: 16, color: '#8B95A1', paddingHorizontal: space.xl, marginTop: -6 },
  resultsSection: { gap: space.lg, paddingHorizontal: space.xl },
  resultRow: { gap: space.sm, paddingRight: space.xl },
  resultItem: { width: 184, padding: 16, gap: 4, borderRadius: 18, backgroundColor: palette.surface, borderWidth: 1.5, borderColor: 'transparent' },
  resultItemActive: { borderColor: palette.brand, backgroundColor: palette.brandSoft },
  resultName: { ...type.bodyStrong, color: palette.ink },
  resultDetail: { ...type.caption, color: palette.muted },
  detailSection: { gap: space.xl, paddingHorizontal: space.xl },
  detailHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.md },
  detailTitleWrap: { flex: 1, gap: 5 },
  hospitalName: { ...type.title1, color: palette.ink, letterSpacing: -0.5 },
  category: { ...type.body, color: palette.muted },
  photo: { width: '100%', height: 210, borderRadius: 24, backgroundColor: palette.infoSoft },
  photoFallback: { minHeight: 116, borderRadius: 24, backgroundColor: '#E8F3FF', padding: space.xl, flexDirection: 'row', alignItems: 'center', gap: space.lg },
  photoSymbol: { width: 52, height: 52, borderRadius: 18, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
  photoSymbolText: { color: palette.brand, fontSize: 28, fontWeight: '500' },
  insuranceSymbol: { backgroundColor: palette.ink },
  insuranceSymbolText: { color: palette.white, fontSize: 13, fontWeight: '700' },
  photoCopy: { flex: 1, gap: 3 },
  photoTitle: { ...type.bodyStrong, color: palette.ink },
  photoDetail: { ...type.caption, color: palette.muted },
  chevron: { color: palette.brand, fontSize: 27, lineHeight: 30 },
  infoSurface: { paddingVertical: 4 },
  infoLine: { minHeight: 66, flexDirection: 'row', gap: space.lg, alignItems: 'center', paddingVertical: 14 },
  infoBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  infoLabel: { ...type.caption, width: 64, color: palette.muted },
  infoValue: { ...type.body, flex: 1, color: palette.ink },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  action: { width: '48.5%', minHeight: 54, borderRadius: 17, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
  actionDisabled: { opacity: 0.36 },
  actionText: { ...type.bodyStrong, color: palette.brand },
  websiteLink: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  websiteText: { ...type.bodyStrong, color: palette.ink },
  websiteArrow: { color: palette.muted, fontSize: 25 },
  directorySection: { gap: space.lg, paddingHorizontal: space.xl },
  directorySwitch: { flexDirection: 'row', gap: space.sm },
  directoryTypeButton: { minHeight: 42, paddingHorizontal: 18, borderRadius: 999, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
  directoryTypeButtonActive: { backgroundColor: palette.ink },
  directoryTypeText: { ...type.caption, color: palette.info },
  directoryTypeTextActive: { color: palette.white },
  directorySurface: { paddingVertical: 0 },
  companyRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 13 },
  companyBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  companyCopy: { flex: 1, gap: 2 },
  companyName: { ...type.bodyStrong, color: palette.ink },
  companyPhone: { ...type.body, color: palette.brand },
  companyHours: { fontSize: 11, lineHeight: 16, color: palette.muted },
  callButton: { minWidth: 62, minHeight: 42, borderRadius: 14, backgroundColor: palette.brandSoft, alignItems: 'center', justifyContent: 'center' },
  callButtonText: { ...type.caption, color: palette.brand, fontWeight: '700' },
  showAllButton: { minHeight: 52, borderRadius: 17, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
  showAllText: { ...type.bodyStrong, color: palette.ink },
  directoryNote: { fontSize: 11, lineHeight: 17, color: palette.muted },
  officialSection: { gap: space.lg, paddingHorizontal: space.xl },
  officialRow: { minHeight: 82, padding: space.xl, borderRadius: 22, backgroundColor: palette.surface, flexDirection: 'row', alignItems: 'center', gap: space.lg },
  officialCopy: { flex: 1, gap: 4 },
  officialTitle: { ...type.bodyStrong, color: palette.ink },
  officialDetail: { ...type.caption, color: palette.muted },
  boundary: { ...type.caption, color: palette.muted, marginHorizontal: space.xl, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, paddingTop: 20 },
  pressed: { opacity: 0.66 },
});
