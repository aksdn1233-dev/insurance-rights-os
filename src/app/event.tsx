import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  DetailRow,
  Eyebrow,
  Page,
  PrimaryButton,
  SectionHeader,
  StatusPill,
  Surface,
  Title,
} from '@/components/product-ui';
import { ShareAction } from '@/components/share-action';
import { betaEvent, betaEventEntryRules, betaEventSafetyNotes } from '@/content/beta-event';
import { palette, space, type } from '@/constants/product-theme';
import { eventShare } from '@/integrations/share';

export default function EventScreen() {
  const router = useRouter();
  return (
    <Page>
      <View style={styles.header}>
        <StatusPill tone="info">사전 안내</StatusPill>
        <Eyebrow>공개 베타 이벤트</Eyebrow>
        <Title>{betaEvent.title}</Title>
        <Text style={styles.copy}>
          좋았던 이야기만 듣지 않아요. 실제로 써보고 느낀 점을 편하게 알려주세요.
        </Text>
      </View>

      <Surface style={styles.prizeSurface}>
        <Text style={styles.prizeLabel}>추첨 {betaEvent.winners}</Text>
        <Text style={styles.prize}>{betaEvent.prize}</Text>
        <Text style={styles.period}>{betaEvent.entryPeriod}</Text>
      </Surface>

      <View style={styles.section}>
        <SectionHeader title="이렇게 참여해요" description="많이 올리지 않아도 최대 두 번이면 충분해요." />
        <Surface>
          {betaEventEntryRules.map((rule, index) => (
            <DetailRow
              key={rule.title}
              title={`${index + 1}. ${rule.title}`}
              detail={rule.detail}
              last={index === betaEventEntryRules.length - 1}
            />
          ))}
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="공정하게 진행해요" />
        <Surface style={styles.notes}>
          {betaEventSafetyNotes.map((note) => (
            <View key={note} style={styles.noteRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.note}>{note}</Text>
            </View>
          ))}
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="일정" />
        <Surface>
          <DetailRow title="참여 기간" detail={betaEvent.entryPeriod} />
          <DetailRow title="당첨자 발표" detail={`${betaEvent.announcementDate} · 이 화면에서 안내`} last />
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="써보고 바로 알려주세요" description="이 화면에서 공유하고, 후기나 개선점을 익명으로 보낼 수 있어요." />
        <Surface style={styles.actions}>
          <PrimaryButton
            label="후기·개선점 보내기"
            onPress={() => router.push({ pathname: '/feedback', params: { from: 'event' } })}
          />
          <ShareAction content={eventShare} label="이벤트 공유하기" />
          <Text style={styles.actionNotice}>지금 보내는 의견은 제품 개선용이며, 이벤트 응모 접수는 아직 아니에요.</Text>
        </Surface>
      </View>

      <Surface style={styles.preparing}>
        <Text style={styles.preparingTitle}>참여 접수를 준비하고 있어요</Text>
        <Text style={styles.preparingCopy}>
          주최자 정보, 문의처, 제세공과금 처리와 개인정보 보관 기간을 공개한 뒤 접수를 열게요.
        </Text>
        <PrimaryButton label="곧 참여할 수 있어요" onPress={() => undefined} disabled />
      </Surface>

      <Text style={styles.footnote}>
        본 이벤트는 신세계백화점과 관계없이 권리찾기 공개 베타 운영자가 진행할 예정입니다.
      </Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.md },
  copy: { ...type.body, color: palette.muted },
  prizeSurface: { gap: space.sm, paddingVertical: 26 },
  prizeLabel: { ...type.caption, color: palette.brand },
  prize: { ...type.title1, color: palette.ink, letterSpacing: -0.5 },
  period: { ...type.body, color: palette.muted },
  section: { gap: space.lg },
  notes: { gap: space.lg },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  check: { ...type.bodyStrong, color: palette.brand },
  note: { ...type.body, color: palette.ink, flex: 1 },
  preparing: { gap: space.lg, backgroundColor: palette.infoSoft },
  preparingTitle: { ...type.title2, color: palette.ink },
  preparingCopy: { ...type.body, color: palette.muted },
  footnote: { ...type.caption, color: palette.muted },
  actions: { gap: space.lg },
  actionNotice: { ...type.caption, color: palette.muted, textAlign: 'center' },
});
