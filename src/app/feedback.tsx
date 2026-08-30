import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  Eyebrow,
  Page,
  PrimaryButton,
  SectionHeader,
  Surface,
  TextButton,
  Title,
} from '@/components/product-ui';
import {
  FEEDBACK_MAX_LENGTH,
  feedbackKindLabels,
  feedbackKinds,
  validateFeedback,
  type FeedbackKind,
} from '@/domain/feedback';
import { palette, space, type } from '@/constants/product-theme';
import { submitFeedback } from '@/integrations/feedback-api';

const errorMessages: Record<string, string> = {
  invalid_kind: '보낼 내용의 종류를 골라주세요.',
  too_short: '조금만 더 자세히 적어주세요. 10글자부터 보낼 수 있어요.',
  too_long: '글이 너무 길어요. 1,000글자 안으로 줄여주세요.',
  sensitive_information: '전화번호, 이메일, 주민등록번호를 지운 뒤 다시 보내주세요.',
  confirmation_required: '민감한 정보를 쓰지 않았는지 확인해주세요.',
  retention_consent_required: '의견을 90일 동안 보관하는 것에 동의해주세요.',
  duplicate: '같은 내용은 오늘 이미 받았어요.',
  rate_limited: '짧은 시간에 여러 번 보냈어요. 1분 뒤 다시 해주세요.',
  network_error: '인터넷 연결을 확인하고 다시 눌러주세요.',
  server_error: '지금은 의견을 받을 수 없어요. 잠시 뒤 다시 해주세요.',
  unknown: '보내지 못했어요. 내용을 확인하고 다시 눌러주세요.',
};

export default function FeedbackScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [kind, setKind] = useState<FeedbackKind>('improvement');
  const [message, setMessage] = useState('');
  const [confirmedNoSensitiveInfo, setConfirmedNoSensitiveInfo] = useState(false);
  const [acceptedRetention, setAcceptedRetention] = useState(false);
  const [phase, setPhase] = useState<'editing' | 'sending' | 'sent'>('editing');
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState('');

  const sourcePath = from === 'event' ? '/event' : '/';

  const send = () => {
    const validationError = validateFeedback({
      kind,
      message,
      confirmedNoSensitiveInfo,
      acceptedRetention,
    });
    if (validationError) {
      setError(errorMessages[validationError]);
      return;
    }

    setPhase('sending');
    setError(null);
    void submitFeedback({
      kind,
      message: message.trim(),
      sourcePath,
      confirmedNoSensitiveInfo: true,
      acceptedRetention: true,
    }).then((result) => {
      if (result.ok && result.receipt) {
        setMessage('');
        setReceipt(result.receipt);
        setPhase('sent');
        return;
      }
      const key = result.error && result.error in errorMessages ? result.error : 'unknown';
      setError(errorMessages[key]);
      setPhase('editing');
    });
  };

  if (phase === 'sent') {
    return (
      <Page>
        <View style={styles.header}>
          <Eyebrow>의견 보내기</Eyebrow>
          <Title>잘 받았어요.</Title>
          <Text style={styles.copy}>보내주신 내용은 서비스를 더 쉽게 만드는 데 사용할게요.</Text>
        </View>
        <Surface style={styles.success}>
          <Text style={styles.successLabel}>접수 번호</Text>
          <Text style={styles.receipt}>{receipt}</Text>
          <Text style={styles.smallCopy}>이름이나 연락처와 연결되지 않는 익명 번호예요.</Text>
        </Surface>
        <PrimaryButton
          label="원래 화면으로 돌아가기"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
      </Page>
    );
  }

  return (
    <Page>
      <View style={styles.header}>
        <Eyebrow>익명 의견 보내기</Eyebrow>
        <Title>어떤 점을{`\n`}바꾸면 좋을까요?</Title>
        <Text style={styles.copy}>좋았던 점도, 불편했던 점도 편하게 적어주세요.</Text>
      </View>

      <View style={styles.section}>
        <SectionHeader title="어떤 이야기인가요?" />
        <View style={styles.kindRow}>
          {feedbackKinds.map((item) => {
            const selected = item === kind;
            return (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  setKind(item);
                  setError(null);
                }}
                style={({ pressed }) => [
                  styles.kindButton,
                  selected && styles.kindButtonSelected,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.kindText, selected && styles.kindTextSelected]}>
                  {feedbackKindLabels[item]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="내용을 적어주세요" description="무엇을 눌렀고, 어떻게 바뀌면 좋을지 적으면 이해하기 쉬워요." />
        <View style={styles.inputWrap}>
          <TextInput
            accessibilityLabel="후기 또는 개선점"
            multiline
            maxLength={FEEDBACK_MAX_LENGTH}
            onChangeText={(value) => {
              setMessage(value);
              setError(null);
            }}
            placeholder="예: 병원 검색 결과에서 주차 가능 여부를 먼저 보고 싶어요."
            placeholderTextColor="#8B95A1"
            style={styles.input}
            textAlignVertical="top"
            value={message}
          />
          <Text style={styles.counter}>{message.length}/{FEEDBACK_MAX_LENGTH}</Text>
        </View>
      </View>

      <Surface style={styles.warning}>
        <Text style={styles.warningTitle}>개인정보는 적지 마세요</Text>
        <Text style={styles.warningCopy}>이름, 전화번호, 이메일, 주민등록번호, 보험번호, 진료 내용은 적지 않아요.</Text>
      </Surface>

      <View style={styles.checks}>
        <CheckRow
          checked={confirmedNoSensitiveInfo}
          label="민감한 정보를 쓰지 않았어요."
          onPress={() => {
            setConfirmedNoSensitiveInfo((value) => !value);
            setError(null);
          }}
        />
        <CheckRow
          checked={acceptedRetention}
          label="작성한 내용이 개선 목적으로 90일 동안 저장되는 것에 동의해요."
          onPress={() => {
            setAcceptedRetention((value) => !value);
            setError(null);
          }}
        />
      </View>

      {error ? <Text style={styles.error} accessibilityLiveRegion="assertive">{error}</Text> : null}
      <PrimaryButton label={phase === 'sending' ? '보내는 중이에요' : '익명으로 보내기'} onPress={send} disabled={phase === 'sending'} />
      <View style={styles.privacyLink}>
        <TextButton label="어떻게 저장되는지 보기" onPress={() => router.push('/privacy')} />
      </View>
    </Page>
  );
}

function CheckRow({ checked, label, onPress }: { checked: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        <Text style={styles.checkmark}>{checked ? '✓' : ''}</Text>
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.md },
  copy: { ...type.body, color: palette.muted },
  section: { gap: space.lg },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  kindButton: {
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindButtonSelected: { borderColor: palette.brand, backgroundColor: palette.brandSoft },
  kindText: { ...type.bodyStrong, color: palette.muted },
  kindTextSelected: { color: palette.brand },
  inputWrap: {
    minHeight: 190,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    padding: space.lg,
    gap: space.sm,
  },
  input: { ...type.body, color: palette.ink, minHeight: 135 },
  counter: { ...type.caption, color: palette.muted, textAlign: 'right' },
  warning: { gap: space.sm, backgroundColor: palette.warningSoft },
  warningTitle: { ...type.bodyStrong, color: palette.warning },
  warningCopy: { ...type.body, color: palette.ink },
  checks: { gap: space.lg },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { borderColor: palette.brand, backgroundColor: palette.brand },
  checkmark: { color: palette.white, fontSize: 15, fontWeight: '700' },
  checkLabel: { ...type.body, color: palette.ink, flex: 1 },
  error: { ...type.bodyStrong, color: palette.danger },
  privacyLink: { alignItems: 'center' },
  pressed: { opacity: 0.68 },
  success: { gap: space.sm, alignItems: 'flex-start' },
  successLabel: { ...type.caption, color: palette.muted },
  receipt: { ...type.title1, color: palette.brand, letterSpacing: 1 },
  smallCopy: { ...type.caption, color: palette.muted },
});
