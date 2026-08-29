import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { DetailRow, Eyebrow, Page, SectionHeader, StatusPill, Surface, TestDataBanner, TextButton, Title } from '@/components/product-ui';
import { palette, space, type } from '@/constants/product-theme';
import { useAppState } from '@/state/app-state';

export default function InsuranceScreen() {
  const router = useRouter();
  const app = useAppState();
  return (
    <Page loading={!app.hydrated}>
      <TestDataBanner />
      <View style={styles.header}>
        <Eyebrow>내 보험</Eyebrow>
        <Title>내 보험을{`\n`}한곳에서 봐요.</Title>
        <Text style={styles.copy}>이름이 같은 보험도 가입한 때와 내용이 다를 수 있어요. 하나씩 정확히 확인해요.</Text>
      </View>
      <View style={styles.section}>
        <SectionHeader title="연결된 계약" />
        {app.policy ? (
          <Surface>
            <StatusPill>연습용 보험</StatusPill>
            <Text style={styles.policyName}>{app.policy.productName}</Text>
            <Text style={styles.insurer}>{app.policy.insurer}</Text>
            <View style={styles.rows}>
              <DetailRow title="보험 시작일" detail="2024년 1월 15일" />
              <DetailRow title="확인한 약관" detail="2024년 1월 약관" />
              <DetailRow title="보험 항목" detail={`${app.policy.coverages.length}개`} last />
            </View>
          </Surface>
        ) : (
          <Surface>
            <Text style={styles.emptyTitle}>아직 불러온 보험이 없어요.</Text>
            <Text style={styles.emptyCopy}>홈에서 연습용 보험을 먼저 불러올 수 있어요.</Text>
          </Surface>
        )}
      </View>
      <View style={styles.actions}>
        <TextButton label="개인정보·이용 안내" onPress={() => router.push('/privacy')} />
        <TextButton label="처음 안내 다시 보기" onPress={app.restartFirstRunGuide} />
        {app.policy ? <TextButton label="연습 내용 처음부터 다시 하기" onPress={app.resetDemo} /> : null}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.md }, copy: { ...type.body, color: palette.muted }, section: { gap: space.lg },
  policyName: { ...type.title2, color: palette.ink, marginTop: space.lg }, insurer: { ...type.body, color: palette.muted, marginTop: space.xs },
  rows: { marginTop: space.lg }, emptyTitle: { ...type.bodyStrong, color: palette.ink }, emptyCopy: { ...type.body, color: palette.muted, marginTop: 6 },
  actions: { gap: space.sm, alignItems: 'flex-start' },
});
