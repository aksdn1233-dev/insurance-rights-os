import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionRow, DetailRow, Eyebrow, Page, PrimaryButton, SectionHeader, StatusPill, Surface, TestDataBanner, Title } from '@/components/product-ui';
import { palette, space, type } from '@/constants/product-theme';
import { getHiraConnectionState, HospitalSummary, searchHospitalsByName } from '@/integrations/hira-hospital-api';
import { officialServices, openOfficialService } from '@/integrations/official-services';

export default function HospitalScreen() {
  const connection = getHiraConnectionState();
  const [query, setQuery] = useState('');
  const [hospitals, setHospitals] = useState<HospitalSummary[]>([]);
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');

  const searchOfficialHospitals = async () => {
    if (!query.trim() || connection.status !== 'ready') return;
    setSearchState('loading');
    try {
      const results = await searchHospitalsByName(query);
      setHospitals(results);
      setSearchState(results.length ? 'idle' : 'empty');
    } catch {
      setHospitals([]);
      setSearchState('error');
    }
  };

  return (
    <Page>
      <TestDataBanner />
      <View style={styles.header}>
        <Eyebrow>병원 찾기</Eyebrow>
        <Title>내게 맞는 병원을{`\n`}먼저 찾아요.</Title>
        <Text style={styles.copy}>
          아픈 곳에 맞는 병원을 먼저 보여드려요. 가까운지, 서류가 편한지도 함께 봐요.
        </Text>
      </View>
      <View style={styles.order}>
        {['아픈 곳에 맞는지', '필요한 진료가 있는지', '가까운지', '서류 내기가 편한지'].map((label, index) => (
          <View key={label} style={styles.orderItem}>
            <Text style={styles.orderNumber}>{index + 1}</Text>
            <Text style={styles.orderLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <SectionHeader title="공식 병원 정보" description="건강보험심사평가원이 제공하는 정보를 사용해요." />
        <Surface style={styles.searchSurface}>
          <View style={styles.connectionLine}>
            <Text style={styles.connectionTitle}>공식 병원 정보 연결</Text>
            <StatusPill tone={connection.status === 'ready' ? 'brand' : 'warning'}>
              {connection.status === 'ready' ? '연결됨' : '준비 중'}
            </StatusPill>
          </View>
          {connection.status === 'ready' ? (
            <>
              <TextInput
                accessibilityLabel="병원 이름"
                autoCapitalize="none"
                placeholder="병원 이름을 써 주세요"
                placeholderTextColor={palette.muted}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => void searchOfficialHospitals()}
                style={styles.input}
              />
              <PrimaryButton
                label={searchState === 'loading' ? '찾는 중이에요' : '공식 정보에서 찾기'}
                disabled={!query.trim() || searchState === 'loading'}
                onPress={() => void searchOfficialHospitals()}
              />
              {searchState === 'loading' ? <ActivityIndicator color={palette.brand} /> : null}
              {searchState === 'empty' ? <Text style={styles.helper}>검색 결과가 없어요. 이름을 짧게 써 보세요.</Text> : null}
              {searchState === 'error' ? <Text style={styles.error}>공식 정보를 불러오지 못했어요. 잠시 뒤 다시 해 주세요.</Text> : null}
              {hospitals.length ? (
                <View style={styles.results}>
                  {hospitals.map((hospital, index) => (
                    <DetailRow
                      key={hospital.id}
                      title={hospital.name}
                      detail={[hospital.kind, hospital.address, hospital.phone].filter(Boolean).join(' · ')}
                      last={index === hospitals.length - 1}
                    />
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.helper}>
              공공데이터 연결키를 넣으면 이 화면에서 바로 찾을 수 있어요. 지금은 공식 건강지도를 바로 열어드려요.
            </Text>
          )}
          <ActionRow
            title={officialServices['hira-map'].title}
            detail={officialServices['hira-map'].description}
            actionLabel={officialServices['hira-map'].actionLabel}
            onPress={() => void openOfficialService('hira-map')}
            last
          />
        </Surface>
      </View>
      <View style={styles.section}>
        <SectionHeader title="가까운 내과 · 연습용" description="화면을 연습하기 위해 만든 병원 목록이에요." />
        <Surface>
          <DetailRow title="늘봄내과 (연습용)" detail="배와 장 진료 · 0.8km · 서류 발급은 전화로 확인" trailing={<StatusPill tone="info">진료 가능</StatusPill>} />
          <DetailRow title="한결의원 (연습용)" detail="일반 내과 · 1.1km · 휴대폰으로 서류 내기 가능" trailing={<StatusPill tone="info">가까워요</StatusPill>} last />
        </Surface>
      </View>
      <Text style={styles.boundary}>
        보험금을 많이 받을 수 있다는 이유로 병원을 추천하지 않아요. 치료는 꼭 의사와 상의하세요.
      </Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.md }, copy: { ...type.body, color: palette.muted }, order: { gap: space.sm },
  orderItem: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 5 },
  orderNumber: { ...type.caption, width: 28, height: 28, lineHeight: 28, textAlign: 'center', borderRadius: 14, color: palette.brand, backgroundColor: palette.brandSoft },
  orderLabel: { ...type.bodyStrong, color: palette.ink }, section: { gap: space.lg },
  boundary: { ...type.caption, color: palette.muted, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, paddingTop: 20 },
  searchSurface: { gap: space.lg },
  connectionLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  connectionTitle: { ...type.bodyStrong, color: palette.ink },
  input: { minHeight: 54, borderRadius: 16, backgroundColor: palette.canvas, paddingHorizontal: space.lg, ...type.body, color: palette.ink },
  helper: { ...type.caption, color: palette.muted },
  error: { ...type.caption, color: palette.danger },
  results: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
});
