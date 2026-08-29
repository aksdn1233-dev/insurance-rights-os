import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import {
  DetailRow,
  Eyebrow,
  Page,
  PrimaryButton,
  ProgressLine,
  SecondaryButton,
  SectionHeader,
  StatusPill,
  Surface,
  TestDataBanner,
  TextButton,
  Title,
} from '@/components/product-ui';
import { palette, space, type } from '@/constants/product-theme';
import { fixtureColonPolypectomyEvent, fixturePolicy } from '@/domain/fixtures';
import { useAppState, type DemoStage } from '@/state/app-state';

const stageOrder: DemoStage[] = [
  'contract',
  'event',
  'candidate',
  'evidence',
  'documents',
  'ready',
  'submitted',
  'outcome',
];

function useStepProgress(stage: DemoStage) {
  const index = stageOrder.indexOf(stage);
  return { current: index + 1, total: stageOrder.length, value: ((index + 1) / stageOrder.length) * 100 };
}

export default function ClaimFlowScreen() {
  const router = useRouter();
  const app = useAppState();
  const progress = useStepProgress(app.stage);
  const [pickerError, setPickerError] = useState<string>();

  const acknowledge = () => {
    Haptics.selectionAsync().catch(() => undefined);
  };

  const pickDocuments = async () => {
    setPickerError(undefined);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        app.addPickedDocuments(result.assets.map((asset) => asset.name));
        acknowledge();
      }
    } catch {
      setPickerError('파일을 열지 못했어요. 연습용 서류로 계속할 수 있어요.');
    }
  };

  const goHome = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Page loading={!app.hydrated} contentStyle={styles.page}>
      <View style={styles.progressHeader}>
        <TestDataBanner />
        <View style={styles.progressCopy}>
          <Text style={styles.progressLabel}>{progress.current}단계 / {progress.total}단계</Text>
          <Text style={styles.progressLabel}>연습 모드</Text>
        </View>
        <ProgressLine value={progress.value} />
      </View>

      {app.stage === 'contract' ? (
        <Stage title="내 보험을 먼저 불러올게요." eyebrow="1단계 · 내 보험">
          <Text style={styles.lead}>
            지금은 연습용 보험을 써요. 실제 내 보험은 바뀌지 않아요.
          </Text>
          <Surface>
            <StatusPill tone="warning">연습용 보험</StatusPill>
            <Text style={styles.objectTitle}>{fixturePolicy.productName}</Text>
            <Text style={styles.objectSub}>{fixturePolicy.insurer}</Text>
            <View style={styles.rows}>
              <DetailRow title="보험 대상" detail="나 (연습용)" />
              <DetailRow title="보험 시작일" detail="2024년 1월 15일" />
              <DetailRow title="확인할 약관" detail="2024년 1월 약관" last />
            </View>
          </Surface>
          <PrimaryButton
            label="연습용 보험 불러오기"
            onPress={() => {
              app.registerFixturePolicy();
              acknowledge();
            }}
          />
        </Stage>
      ) : null}

      {app.stage === 'event' ? (
        <Stage title="어떤 치료를 받았나요?" eyebrow="2단계 · 받은 치료">
          <Text style={styles.lead}>어려운 병 이름은 몰라도 괜찮아요. 받은 치료만 골라주세요.</Text>
          <Surface>
            <StatusPill tone="info">이미 받은 치료 · 연습용</StatusPill>
            <Text style={styles.objectTitle}>{fixtureColonPolypectomyEvent.label}</Text>
            <Text style={styles.objectSub}>2026년 8월 25일 · 늘봄내과 (연습용)</Text>
            <View style={styles.factBox}>
              <Text style={styles.factTitle}>이렇게 적혀 있어요</Text>
              <Text style={styles.factCopy}>내시경으로 용종을 제거했어요</Text>
            </View>
          </Surface>
          <Text style={styles.boundaryCopy}>
            이미 받은 치료만 적어주세요. 보험금을 받기 위해 새 치료를 권하지 않아요.
          </Text>
          <PrimaryButton
            label="이 치료가 맞아요"
            onPress={() => {
              app.recordFixtureEvent();
              acknowledge();
            }}
          />
        </Stage>
      ) : null}

      {app.stage === 'candidate' && app.candidate ? (
        <Stage title={app.candidate.headline} eyebrow="3단계 · 찾은 보험">
          <Text style={styles.lead}>
            받은 치료와 내 보험에서 서로 맞는 내용을 찾았어요.
          </Text>
          <Surface style={styles.radarSurface}>
            <StatusPill>확인할 항목</StatusPill>
            <Text style={styles.objectTitle}>{app.policy?.coverages[0].title}</Text>
            <Text style={styles.benefit}>{app.candidate.benefitLabel}</Text>
            <View style={styles.reasonList}>
              {app.candidate.matchReasons.map((reason, index) => (
                <View key={reason} style={styles.reasonRow}>
                  <Text style={styles.reasonIndex}>{index + 1}</Text>
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
          </Surface>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>보험금이 정해진 건 아니에요.</Text>
            <Text style={styles.noticeCopy}>실제로 돈을 주는지와 금액은 보험사가 마지막에 결정해요.</Text>
          </View>
          <PrimaryButton label="찾은 이유 보기" onPress={app.showEvidence} />
        </Stage>
      ) : null}

      {app.stage === 'evidence' && app.candidate ? (
        <Stage title="왜 확인해야 하는지 알려드릴게요." eyebrow="4단계 · 찾은 이유">
          <Text style={styles.lead}>받은 치료와 보험 약관에서 같은 내용을 찾았어요.</Text>
          {app.candidate.evidence.map((evidence) => (
            <Surface key={evidence.clauseId}>
              <View style={styles.splitTop}>
                <StatusPill tone="info">보험에 적힌 내용</StatusPill>
                <Text style={styles.version}>2024년 1월 약관</Text>
              </View>
              <Text style={styles.evidenceTitle}>{evidence.title}</Text>
              <Text style={styles.evidencePath}>약관에서 찾은 곳 · 질병수술특약 2조 1항</Text>
              <Text style={styles.quote}>“{evidence.excerpt}”</Text>
              <Text style={styles.hash}>언제 어떤 내용을 확인했는지 안전하게 기록했어요.</Text>
            </Surface>
          ))}
          <View style={styles.explainBlock}>
            <SectionHeader title="쉽게 말하면" />
            <Text style={styles.explainCopy}>
              내시경으로 용종을 제거한 기록이 있고, 이 치료가 보험 약관에 적혀 있어요.
              보험이 시작된 뒤에 치료받은 것도 확인했어요.
            </Text>
          </View>
          <PrimaryButton label="필요한 서류 보기" onPress={app.startDocuments} />
        </Stage>
      ) : null}

      {app.stage === 'documents' && app.candidate ? (
        <Stage title="이 서류가 필요해요." eyebrow="5단계 · 서류 준비">
          <Text style={styles.lead}>
            휴대폰에 있는 서류를 고르세요. 지금은 연습용 서류로도 계속할 수 있어요.
          </Text>
          <Surface>
            {app.candidate.requiredDocuments.map((requirement, index) => {
              const document = app.documents.find((item) => item.requirementId === requirement.id);
              const accepted = document?.validation === 'accepted';
              return (
                <DetailRow
                  key={requirement.id}
                  title={requirement.title}
                  detail={document?.fileName ?? requirement.reason}
                  trailing={
                    <StatusPill tone={accepted ? 'brand' : 'warning'}>
                      {accepted ? '준비됨' : document ? '확인 필요' : '필요해요'}
                    </StatusPill>
                  }
                  last={index === app.candidate!.requiredDocuments.length - 1}
                />
              );
            })}
          </Surface>
          {app.readiness ? (
            <View style={styles.readinessInline}>
              <Text style={styles.readinessInlineText}>서류 {app.readiness.acceptedCount}개를 준비했어요</Text>
              <ProgressLine value={app.readiness.score} />
            </View>
          ) : null}
          {pickerError ? <Text style={styles.errorText}>{pickerError}</Text> : null}
          <SecondaryButton label="휴대폰에서 서류 고르기" onPress={pickDocuments} />
          <PrimaryButton
            label="연습용 서류로 계속하기"
            onPress={() => {
              app.fillFixtureDocuments();
              acknowledge();
            }}
          />
          {Platform.OS === 'web' ? (
            <Text style={styles.boundaryCopy}>파일 내용과 실제 파일 이름은 저장하거나 전송하지 않아요.</Text>
          ) : null}
        </Stage>
      ) : null}

      {app.stage === 'ready' && app.candidate && app.readiness ? (
        <Stage title="서류를 모두 준비했어요." eyebrow="6단계 · 보내기 전 확인">
          <Text style={styles.lead}>필요한 서류가 다 모였다는 뜻이에요. 보험금이 정해진 것은 아니에요.</Text>
          <Surface style={styles.readinessSurface}>
            <View style={styles.scoreRow}>
              <View>
                <StatusPill>다 준비했어요</StatusPill>
                <Text style={styles.score}>{app.readiness.acceptedCount}개</Text>
              </View>
              <Text style={styles.scoreDetail}>
                필요한 서류를{`\n`}모두 확인했어요
              </Text>
            </View>
            <ProgressLine value={app.readiness.score} />
          </Surface>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>실제 보험사로 보내지 않아요.</Text>
            <Text style={styles.noticeCopy}>
              지금은 연습 화면이라서 제출하는 과정만 보여드려요.
            </Text>
          </View>
          <PrimaryButton label="연습으로 제출하기" onPress={app.submitFixtureClaim} />
        </Stage>
      ) : null}

      {app.stage === 'submitted' ? (
        <Stage title="서류를 보냈어요." eyebrow="7단계 · 제출 완료">
          <Text style={styles.lead}>연습으로 보낸 서류가 잘 도착했어요. 이제 결과를 골라볼게요.</Text>
          <Surface>
            <DetailRow title="보낸 곳" detail="연습용 보험사" />
            <DetailRow title="현재 상태" detail="서류가 잘 도착했어요" />
            <DetailRow title="안전 기록" detail="언제 무엇을 보냈는지 저장했어요" last />
          </Surface>
          <View style={styles.outcomeButtons}>
            <PrimaryButton
              label="지급됐다고 해보기"
              onPress={() => {
                app.recordFixtureOutcome('paid');
                acknowledge();
              }}
            />
            <SecondaryButton
              label="거절됐다고 해보기"
              onPress={() => {
                app.recordFixtureOutcome('denied');
                acknowledge();
              }}
            />
          </View>
        </Stage>
      ) : null}

      {app.stage === 'outcome' && app.outcome && app.learningSignal ? (
        <Stage
          title={app.outcome.status === 'paid' ? '지급 결과를 저장했어요.' : '거절 결과를 저장했어요.'}
          eyebrow="8단계 · 결과 저장">
          <Text style={styles.lead}>다음에는 더 잘 알려드릴 수 있도록 결과를 안전하게 기록했어요.</Text>
          <Surface>
            <StatusPill tone={app.outcome.status === 'paid' ? 'brand' : 'danger'}>
              {app.outcome.status === 'paid' ? '연습용 지급' : '연습용 거절'}
            </StatusPill>
            {app.outcome.amount ? <Text style={styles.outcomeAmount}>200,000원</Text> : null}
            <Text style={styles.objectTitle}>{app.outcome.reasonLabel}</Text>
            <Text style={styles.objectSub}>연습 결과예요. 실제 보험금과는 관계없어요.</Text>
          </Surface>
          <Surface style={styles.learningSurface}>
            <SectionHeader title="결과를 어떻게 썼나요?" />
            <Text style={styles.explainCopy}>{app.learningSignal.note}</Text>
            <DetailRow title="다음 할 일" detail={app.learningSignal.action === 'queue_rule_review' ? '전문가가 다시 살펴봐요' : '결과를 잘 모아둬요'} />
            <DetailRow title="보험 기준 자동 변경" detail="하지 않아요" />
            <DetailRow title="안전하게 남긴 기록" detail={`${app.audit.length}개`} last />
          </Surface>
          <PrimaryButton label="홈으로 돌아가기" onPress={goHome} />
          <TextButton
            label="연습을 처음부터 다시 하기"
            onPress={() => {
              app.resetDemo();
              goHome();
            }}
          />
        </Stage>
      ) : null}
    </Page>
  );
}

function Stage({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow: string }) {
  return (
    <View style={styles.stage}>
      <View style={styles.stageHeader}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Title>{title}</Title>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingBottom: 60 },
  progressHeader: { gap: 10 },
  progressCopy: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  progressLabel: { ...type.caption, color: palette.muted },
  stage: { gap: space.xl },
  stageHeader: { gap: space.sm },
  lead: { ...type.body, color: palette.muted },
  objectTitle: { ...type.title2, color: palette.ink, marginTop: space.lg },
  objectSub: { ...type.body, color: palette.muted, marginTop: 5 },
  rows: { marginTop: space.lg },
  factBox: { marginTop: space.lg, paddingTop: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, gap: 4 },
  factTitle: { ...type.caption, color: palette.muted },
  factCopy: { ...type.bodyStrong, color: palette.ink },
  boundaryCopy: { ...type.caption, color: palette.muted },
  radarSurface: { borderColor: palette.brand, gap: 2 },
  benefit: { ...type.bodyStrong, color: palette.brand, marginTop: 7 },
  reasonList: { marginTop: space.xl, gap: space.md },
  reasonRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  reasonIndex: { ...type.caption, color: palette.brand, width: 24, height: 24, lineHeight: 24, textAlign: 'center', borderRadius: 12, backgroundColor: palette.brandSoft },
  reasonText: { ...type.body, color: palette.ink, flex: 1 },
  notice: { borderLeftWidth: 3, borderLeftColor: palette.warning, paddingLeft: space.lg, gap: 4 },
  noticeTitle: { ...type.bodyStrong, color: palette.ink },
  noticeCopy: { ...type.body, color: palette.muted },
  splitTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md, alignItems: 'center' },
  version: { ...type.caption, color: palette.muted, flexShrink: 1, textAlign: 'right' },
  evidenceTitle: { ...type.title2, color: palette.ink, marginTop: space.lg },
  evidencePath: { ...type.caption, color: palette.info, marginTop: 5 },
  quote: { ...type.body, color: palette.ink, marginTop: space.xl, lineHeight: 26 },
  hash: { ...type.caption, color: palette.muted, marginTop: space.lg },
  explainBlock: { gap: space.md },
  explainCopy: { ...type.body, color: palette.muted },
  readinessInline: { gap: 8 },
  readinessInlineText: { ...type.caption, color: palette.muted },
  errorText: { ...type.caption, color: palette.danger },
  readinessSurface: { gap: space.xl },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: space.lg },
  score: { fontSize: 42, lineHeight: 50, fontWeight: '700', color: palette.ink, marginTop: space.sm },
  scoreDetail: { ...type.caption, color: palette.muted, textAlign: 'right', paddingBottom: 5, flex: 1 },
  outcomeButtons: { gap: space.md },
  outcomeAmount: { fontSize: 32, lineHeight: 40, fontWeight: '700', color: palette.ink, marginTop: space.lg },
  learningSurface: { gap: space.md },
});
