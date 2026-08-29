import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import {
  ActionRow,
  DetailRow,
  Eyebrow,
  Page,
  PrimaryButton,
  SectionHeader,
  StatusPill,
  Surface,
  TestDataBanner,
  TextButton,
  Title,
} from '@/components/product-ui';
import { palette, space, type } from '@/constants/product-theme';
import { officialServices, openOfficialService } from '@/integrations/official-services';
import { useAppState } from '@/state/app-state';

type CheckState = 'intro' | 'checking' | 'result';

export default function RefundCheckScreen() {
  const router = useRouter();
  const app = useAppState();
  const [checkState, setCheckState] = useState<CheckState>('intro');

  useEffect(() => {
    if (checkState !== 'checking') return;
    const timer = setTimeout(() => {
      setCheckState('result');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }, 900);
    return () => clearTimeout(timer);
  }, [checkState]);

  return (
    <Page loading={!app.hydrated}>
      <TestDataBanner />

      <View style={styles.hero}>
        <Eyebrow>숨은 보험금·환급금 찾기</Eyebrow>
        <Title>놓친 돈이 있는지{`\n`}함께 확인해요.</Title>
        <Text style={styles.lead}>
          여러 곳을 따로 찾지 않아도 되도록, 확인할 곳을 한 화면에 모았어요.
        </Text>
      </View>

      {checkState === 'intro' ? (
        <>
          <View style={styles.section}>
            <SectionHeader title="어디를 확인하나요?" />
            <Surface>
              <DetailRow title="숨은 보험금" detail="오래 찾지 않은 보험금이 있는지 봐요." />
              <DetailRow title="놓친 보험 청구" detail="치료받고 청구하지 않은 항목을 봐요." />
              <DetailRow title="병원비 환급" detail="공식 기관에서 확인할 환급금이 있는지 봐요." last />
            </Surface>
          </View>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>앱 안의 분석은 연습용이에요.</Text>
            <Text style={styles.noticeCopy}>
              아래 공식 조회는 지금 바로 이용할 수 있어요. 로그인과 본인확인은 각 기관에서 안전하게 진행해요.
            </Text>
          </View>
          <View style={styles.section}>
            <SectionHeader title="지금 바로 공식 조회하기" />
            <Surface>
              <ActionRow
                title={officialServices['find-my-insurance'].title}
                detail={officialServices['find-my-insurance'].description}
                actionLabel={officialServices['find-my-insurance'].actionLabel}
                onPress={() => void openOfficialService('find-my-insurance')}
              />
              <ActionRow
                title={officialServices['nhis-refund'].title}
                detail={officialServices['nhis-refund'].description}
                actionLabel={officialServices['nhis-refund'].actionLabel}
                onPress={() => void openOfficialService('nhis-refund')}
                last
              />
            </Surface>
          </View>
          <PrimaryButton label="내 앱 분석도 연습해 보기" onPress={() => setCheckState('checking')} />
        </>
      ) : null}

      {checkState === 'checking' ? (
        <Surface style={styles.checking}>
          <ActivityIndicator size="large" color={palette.brand} />
          <Text style={styles.checkingTitle}>앱에 있는 정보를 살피고 있어요</Text>
          <Text style={styles.checkingCopy}>내 보험 · 받은 치료 · 준비한 서류</Text>
        </Surface>
      ) : null}

      {checkState === 'result' ? (
        <>
          <Surface style={styles.resultHeader}>
            <StatusPill>확인 끝</StatusPill>
            <Text style={styles.resultTitle}>확인할 곳이 2개 있어요.</Text>
            <Text style={styles.resultCopy}>금액은 아래 공식 서비스에서 직접 확인해요.</Text>
          </Surface>

          <View style={styles.section}>
            <SectionHeader title="앱에서 찾은 내용" />
            <Surface>
              <DetailRow
                title="숨은 보험금"
                detail="공식 조회 연결이 필요해요."
                trailing={<StatusPill tone="warning">연결 필요</StatusPill>}
              />
              <DetailRow
                title="놓친 보험 청구"
                detail={app.candidate ? app.candidate.headline : '내 보험과 받은 치료를 먼저 알려주세요.'}
                trailing={<StatusPill tone={app.candidate ? 'brand' : 'warning'}>{app.candidate ? '1개' : '확인 전'}</StatusPill>}
              />
              <DetailRow
                title="병원비 환급"
                detail="공식 기관 조회 연결이 필요해요."
                trailing={<StatusPill tone="warning">연결 필요</StatusPill>}
                last
              />
            </Surface>
          </View>

          <View style={styles.section}>
            <SectionHeader title="공식 서비스에서 확인하기" description="결과와 금액은 공식 서비스에서 직접 확인해요." />
            <Surface>
              <ActionRow
                title={officialServices['find-my-insurance'].title}
                detail="생명보험협회·손해보험협회 공식 서비스"
                actionLabel={officialServices['find-my-insurance'].actionLabel}
                onPress={() => void openOfficialService('find-my-insurance')}
              />
              <ActionRow
                title={officialServices['nhis-refund'].title}
                detail="국민건강보험공단 공식 서비스"
                actionLabel={officialServices['nhis-refund'].actionLabel}
                onPress={() => void openOfficialService('nhis-refund')}
              />
              <ActionRow
                title={officialServices.silson24.title}
                detail="보험개발원 실손보험 청구 서비스"
                actionLabel={officialServices.silson24.actionLabel}
                onPress={() => void openOfficialService('silson24')}
                last
              />
            </Surface>
          </View>

          {!app.policy ? (
            <PrimaryButton label="내 보험부터 확인하기" onPress={() => router.replace('/claim-flow')} />
          ) : null}
          <TextButton label="다시 조회하기" onPress={() => setCheckState('intro')} />
        </>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { gap: space.md },
  lead: { ...type.body, color: palette.muted },
  section: { gap: space.lg },
  notice: { borderLeftWidth: 3, borderLeftColor: palette.warning, paddingLeft: space.lg, gap: 5 },
  noticeTitle: { ...type.bodyStrong, color: palette.ink },
  noticeCopy: { ...type.body, color: palette.muted },
  checking: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  checkingTitle: { ...type.title2, color: palette.ink },
  checkingCopy: { ...type.body, color: palette.muted, textAlign: 'center' },
  resultHeader: { gap: space.md },
  resultTitle: { ...type.title1, color: palette.ink, marginTop: space.sm },
  resultCopy: { ...type.body, color: palette.muted },
});
