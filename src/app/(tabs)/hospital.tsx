import { useCallback, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Image,
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
import {
  DEFAULT_MAP_CENTER,
  formatDistance,
  HospitalPlace,
  kakaoDirectionsUrl,
  kakaoRoadviewUrl,
  MapConnectionStatus,
  phoneLink,
  readableOpeningHours,
} from '@/integrations/hospital-discovery';
import { officialServices, openOfficialService } from '@/integrations/official-services';

const quickSearches = ['내과', '소아청소년과', '정형외과', '산부인과'];

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
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [places, setPlaces] = useState<HospitalPlace[]>([]);
  const [selected, setSelected] = useState<HospitalPlace>();
  const [mapStatus, setMapStatus] = useState<MapConnectionStatus>('loading');
  const [location, setLocation] = useState(DEFAULT_MAP_CENTER);
  const [locationState, setLocationState] = useState<'loading' | 'ready' | 'denied'>('loading');
  const [failedImageId, setFailedImageId] = useState<string>();

  const findMyLocation = useCallback(async () => {
    try {
      const permission = await Promise.race([
        Location.requestForegroundPermissionsAsync(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
      ]);
      if (!permission) {
        setLocationState('denied');
        return;
      }
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationState('denied');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      setLocationState('ready');
    } catch {
      setLocationState('denied');
    }
  }, []);

  useEffect(() => {
    const task = setTimeout(() => void findMyLocation(), 0);
    return () => clearTimeout(task);
  }, [findMyLocation]);

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

  const callSelected = async () => {
    const url = phoneLink(selected?.phone);
    if (url) await Linking.openURL(url);
  };

  return (
    <Page contentStyle={styles.page}>
      <View style={styles.header}>
        <Eyebrow>가까운 병원</Eyebrow>
        <Title>어디로 가야 할지{`\n`}지도에서 바로 봐요.</Title>
        <Text style={styles.copy}>진료과를 먼저 맞추고, 가까운 순서로 보여드려요.</Text>
      </View>

      <View style={styles.searchArea}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="진료과나 병원 이름"
            autoCapitalize="none"
            enterKeyHint="search"
            placeholder="예: 내과, 정형외과, 병원 이름"
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
            {locationState === 'loading' ? <ActivityIndicator size="small" color={palette.brand} /> : <View style={styles.locationDot} />}
            <Text style={styles.locationText}>
              {locationState === 'ready' ? '현재 위치 주변' : locationState === 'denied' ? '서울 시청 주변 · 위치 꺼짐' : '현재 위치 확인 중'}
            </Text>
          </View>
          {locationState === 'denied' ? (
            <TextButton
              label="위치 다시 켜기"
              onPress={() => {
                setLocationState('loading');
                void findMyLocation();
              }}
            />
          ) : null}
        </View>
        <View style={styles.mapFrame}>
          <HospitalMap
            latitude={location.latitude}
            longitude={location.longitude}
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
            ? '카카오맵 장소 정보 · 사진과 진료시간은 병원 상세에서 최신 내용을 확인해요.'
            : mapStatus === 'open'
              ? 'OpenStreetMap 공개 정보 · 병원에서 올린 정보와 다를 수 있어 전화 확인이 필요해요.'
              : mapStatus === 'error'
                ? '지도를 불러오지 못했어요. 공식 건강지도에서 다시 확인할 수 있어요.'
                : '지도와 병원 정보를 불러오는 중이에요.'}
        </Text>
        <Text style={styles.privacyText}>주변 검색을 위해 지도 제공사에 지도 중심 좌표를 보내며, 앱 서버에는 위치를 저장하지 않아요.</Text>
      </View>

      {places.length ? (
        <View style={styles.resultsSection}>
          <SectionHeader title={`${activeQuery || '가까운 병원'} ${places.length}곳`} description="목록을 누르면 지도와 상세정보가 함께 움직여요." />
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
              <View style={styles.photoSymbol}><Text style={styles.photoSymbolText}>＋</Text></View>
              <View style={styles.photoCopy}>
                <Text style={styles.photoTitle}>병원 사진 보기</Text>
                <Text style={styles.photoDetail}>인터넷에 공개된 사진을 상세정보에서 확인해요</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}

          <Surface style={styles.infoSurface}>
            <InfoLine label="주소" value={selected.address} />
            <InfoLine label="전화" value={selected.phone || '등록된 전화번호가 없어요'} />
            <InfoLine label="진료시간" value={readableOpeningHours(selected.openingHours)} last />
          </Surface>

          <View style={styles.actionGrid}>
            <HospitalAction label="전화하기" disabled={!selected.phone} onPress={() => void callSelected()} />
            <HospitalAction label="길찾기" onPress={() => void openTrustedUrl(kakaoDirectionsUrl(selected))} />
            <HospitalAction label="로드뷰" onPress={() => void openTrustedUrl(kakaoRoadviewUrl(selected))} />
            <HospitalAction label="사진·시간 보기" onPress={() => void openTrustedUrl(selected.placeUrl)} />
          </View>
          {selected.website ? (
            <Pressable accessibilityRole="link" onPress={() => void openTrustedUrl(selected.website!)} style={styles.websiteLink}>
              <Text style={styles.websiteText}>병원 홈페이지 보기</Text>
              <Text style={styles.websiteArrow}>›</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.officialSection}>
        <SectionHeader title="한 번 더 공식 정보로 확인" description="운영시간과 진료과는 바뀔 수 있어요." />
        <Pressable
          accessibilityRole="link"
          onPress={() => void openOfficialService('hira-map')}
          style={({ pressed }) => [styles.officialRow, pressed && styles.pressed]}>
          <View style={styles.officialCopy}>
            <Text style={styles.officialTitle}>{officialServices['hira-map'].title}</Text>
            <Text style={styles.officialDetail}>심평원 건강지도에서 진료과와 병원 정보를 확인해요.</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.boundary}>
        의료적으로 맞는 진료과를 먼저 찾고 그다음 거리를 봐요. 보험금이 많이 나온다는 이유로 병원을 추천하지 않아요.
      </Text>
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

const styles = StyleSheet.create({
  page: { paddingHorizontal: 0, paddingTop: space.xl },
  header: { gap: space.md, paddingHorizontal: space.xl },
  copy: { ...type.body, color: palette.muted },
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
  officialSection: { gap: space.lg, paddingHorizontal: space.xl },
  officialRow: { minHeight: 82, padding: space.xl, borderRadius: 22, backgroundColor: palette.surface, flexDirection: 'row', alignItems: 'center', gap: space.lg },
  officialCopy: { flex: 1, gap: 4 },
  officialTitle: { ...type.bodyStrong, color: palette.ink },
  officialDetail: { ...type.caption, color: palette.muted },
  boundary: { ...type.caption, color: palette.muted, marginHorizontal: space.xl, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, paddingTop: 20 },
  pressed: { opacity: 0.66 },
});
