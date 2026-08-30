import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  DetailRow,
  Eyebrow,
  Page,
  PrimaryButton,
  SectionHeader,
  StatusPill,
  Surface,
  TestDataBanner,
  Title,
} from '@/components/product-ui';
import { ShareAction } from '@/components/share-action';
import { palette, space, type } from '@/constants/product-theme';
import { useAppState } from '@/state/app-state';
import { productShare } from '@/integrations/share';

const stageLabels = {
  contract: '연습용 보험을 불러와요',
  event: '받은 치료를 알려주세요',
  candidate: '확인할 보험이 있어요',
  evidence: '왜 확인해야 하는지 볼까요?',
  documents: '필요한 서류를 준비해요',
  ready: '서류를 다 준비했어요',
  submitted: '연습 결과를 확인해요',
  outcome: '끝까지 확인했어요',
} as const;

export default function HomeScreen() {
  const router = useRouter();
  const app = useAppState();

  return (
    <Page loading={!app.hydrated}>
      <TestDataBanner />
      <View style={styles.brandIntro} accessibilityLabel="보험의 달인, 놓치기 쉬운 보험 혜택을 쉽게 찾아요">
        <Text style={styles.brandName}>보험의 달인</Text>
        <Text style={styles.brandPromise}>놓치기 쉬운 보험 혜택을 쉽게 찾아요</Text>
      </View>
      <View style={styles.hero}>
        <Eyebrow>치료 선택 · 혜택 확인 · 서류 준비</Eyebrow>
        <Title>병원에 다녀오셨나요?</Title>
        <Text style={styles.heroCopy}>
          받은 치료를 알려주세요.{`\n`}내 보험에서 확인할 혜택과 필요한 서류를 찾아드려요.
        </Text>
      </View>

      <Surface style={styles.primarySurface}>
        <StatusPill tone={app.candidate ? 'brand' : 'info'}>
          {app.candidate ? '확인하는 중' : '바로 시작'}
        </StatusPill>
        <Text style={styles.actionTitle}>
          {app.stage === 'contract' ? '받은 치료로 보험 확인하기' : stageLabels[app.stage]}
        </Text>
        <Text style={styles.actionCopy}>
          {app.candidate?.headline ?? '연습용 보험으로 처음부터 끝까지 쉽게 해볼 수 있어요.'}
        </Text>
        <PrimaryButton
          label={app.stage === 'contract' ? '보험 확인 시작하기' : '이어서 하기'}
          onPress={() => router.push('/claim-flow')}
          accessibilityHint="연습용 보험으로 받은 치료와 보험을 확인하는 화면을 엽니다"
        />
      </Surface>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="숨은 보험금과 환급금 확인하기"
        onPress={() => router.push('/refund-check')}
        style={({ pressed }) => pressed && styles.pressed}>
        <Surface style={styles.refundSurface}>
          <View style={styles.refundCopy}>
            <Text style={styles.refundEyebrow}>환급금 찾기</Text>
            <Text style={styles.refundTitle}>놓친 돈이 있는지도 확인해요</Text>
            <Text style={styles.refundDescription}>숨은 보험금 · 놓친 청구 · 병원비 환급</Text>
          </View>
          <Text style={styles.refundArrow}>›</Text>
        </Surface>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="공개 베타 후기 이벤트 자세히 보기"
        onPress={() => router.push('/event')}
        style={({ pressed }) => pressed && styles.pressed}>
        <Surface style={styles.eventSurface}>
          <View style={styles.eventCopy}>
            <Text style={styles.eventEyebrow}>공개 베타 이벤트 · 사전 안내</Text>
            <Text style={styles.eventTitle}>써본 이야기를 들려주세요</Text>
            <Text style={styles.eventDescription}>추첨 1명 · 신세계백화점 상품권 100만원 상당</Text>
          </View>
          <Text style={styles.refundArrow}>›</Text>
        </Surface>
      </Pressable>

      <View style={styles.section}>
        <SectionHeader title="함께 더 쉽게 만들어요" description="친구에게 알려주거나, 불편한 점을 익명으로 보내주세요." />
        <Surface style={styles.communitySurface}>
          <View style={styles.communityCopy}>
            <Text style={styles.communityTitle}>한 번 눌러 바로 공유해요</Text>
            <Text style={styles.communityDescription}>휴대폰에서는 카카오톡이나 문자 같은 공유 앱이 바로 열려요.</Text>
          </View>
          <ShareAction content={productShare} label="보험의 달인 공유하기" />
          <PrimaryButton
            label="후기·개선점 보내기"
            onPress={() => router.push({ pathname: '/feedback', params: { from: 'home' } })}
          />
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="내가 할 일" description="지금 확인하면 좋은 것만 모았어요." />
        <Surface>
          <DetailRow
            title={app.policy ? '연습용 보험을 불러왔어요' : '내 보험을 먼저 불러와요'}
            detail={app.policy ? app.policy.productName : '서류를 올리거나 직접 적을 수 있어요.'}
            trailing={<StatusPill tone={app.policy ? 'brand' : 'warning'}>{app.policy ? '끝' : '아직'}</StatusPill>}
          />
          <DetailRow
            title="최근에 받은 치료 떠올리기"
            detail="검사나 치료를 받은 적이 있는지 생각해봐요."
            trailing={<Text style={styles.chevron}>›</Text>}
            last
          />
        </Surface>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>찾은 이유도 함께 알려드려요.</Text>
        <Text style={styles.noteCopy}>
          여기에서 찾은 내용은 확인할 항목이에요. 실제로 보험금을 주는지는 보험사가 마지막에 결정해요.
        </Text>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  brandIntro: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
    paddingBottom: space.xl,
    gap: 4,
  },
  brandName: { fontSize: 30, lineHeight: 38, fontWeight: '800', color: palette.ink, letterSpacing: -1 },
  brandPromise: { ...type.body, color: palette.brand },
  hero: { gap: space.md },
  heroCopy: { ...type.body, color: palette.muted, maxWidth: 520 },
  primarySurface: { gap: space.lg, paddingVertical: 24 },
  actionTitle: { ...type.title1, color: palette.ink, letterSpacing: -0.5 },
  actionCopy: { ...type.body, color: palette.muted },
  section: { gap: space.lg },
  chevron: { fontSize: 28, lineHeight: 30, color: palette.muted },
  note: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, paddingTop: 24, gap: 7 },
  noteTitle: { ...type.bodyStrong, color: palette.ink },
  noteCopy: { ...type.caption, color: palette.muted },
  pressed: { opacity: 0.72 },
  refundSurface: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  refundCopy: { flex: 1, gap: 5 },
  refundEyebrow: { ...type.caption, color: palette.brand },
  refundTitle: { ...type.title2, color: palette.ink },
  refundDescription: { ...type.caption, color: palette.muted },
  refundArrow: { fontSize: 30, lineHeight: 32, color: palette.brand },
  eventSurface: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  eventCopy: { flex: 1, gap: 5 },
  eventEyebrow: { ...type.caption, color: palette.brand },
  eventTitle: { ...type.title2, color: palette.ink },
  eventDescription: { ...type.caption, color: palette.muted },
  communitySurface: { gap: space.lg },
  communityCopy: { gap: 5 },
  communityTitle: { ...type.title2, color: palette.ink },
  communityDescription: { ...type.body, color: palette.muted },
});
