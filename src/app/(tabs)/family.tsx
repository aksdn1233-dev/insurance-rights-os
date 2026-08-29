import { StyleSheet, Text, View } from 'react-native';

import { DetailRow, Eyebrow, Page, SectionHeader, StatusPill, Surface, TestDataBanner, Title } from '@/components/product-ui';
import { palette, space, type } from '@/constants/product-theme';
import { useAppState } from '@/state/app-state';

export default function FamilyScreen() {
  const app = useAppState();
  return (
    <Page loading={!app.hydrated}>
      <TestDataBanner />
      <View style={styles.header}>
        <Eyebrow>가족 보험</Eyebrow>
        <Title>가족 보험도{`\n`}함께 챙겨요.</Title>
        <Text style={styles.copy}>
          가족이 허락한 내용만 볼 수 있어요. 허락은 언제든 바꿀 수 있어요.
        </Text>
      </View>
      <View style={styles.section}>
        <SectionHeader title="우리 가족" description="누구의 보험을 확인할지 골라보세요." />
        <Surface>
          <DetailRow
            title="나"
            detail={app.policy ? '보험 1개 · 최근 치료 1개' : '불러온 보험이 없어요'}
            trailing={<StatusPill>{app.policy ? '확인 중' : '나'}</StatusPill>}
          />
          <DetailRow
            title="어머니 (연습용)"
            detail="먼저 어머니의 허락을 받아야 해요."
            trailing={<StatusPill tone="warning">허락 필요</StatusPill>}
            last
          />
        </Surface>
      </View>
      <View style={styles.guardrail}>
        <Text style={styles.guardrailTitle}>가족 정보는 가족의 것이에요.</Text>
        <Text style={styles.guardrailCopy}>
          허락받은 일만 대신할 수 있어요. 병원 기록은 마음대로 보여주지 않아요.
        </Text>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.md }, copy: { ...type.body, color: palette.muted }, section: { gap: space.lg },
  guardrail: { gap: 7, paddingTop: space.sm }, guardrailTitle: { ...type.bodyStrong, color: palette.ink },
  guardrailCopy: { ...type.body, color: palette.muted },
});
