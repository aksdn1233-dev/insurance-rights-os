import { usePathname, useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/product-ui';
import { betaEvent } from '@/content/beta-event';
import { palette, space, type } from '@/constants/product-theme';
import { useAppState } from '@/state/app-state';

export function BetaEventNotice() {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, guideSeen, eventNoticeSeen, dismissEventNotice } = useAppState();

  if (!hydrated || !guideSeen || eventNoticeSeen || pathname !== '/') return null;

  const openDetails = () => {
    dismissEventNotice();
    router.push('/event');
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissEventNotice}>
      <SafeAreaView style={styles.backdrop}>
        <View
          style={styles.dialog}
          accessibilityRole="alert"
          accessibilityLabel="공개 베타 이벤트 안내">
          <View style={styles.topRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>이벤트 사전 안내</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이벤트 알림 닫기"
              hitSlop={12}
              onPress={dismissEventNotice}>
              <Text style={styles.close}>닫기</Text>
            </Pressable>
          </View>

          <View style={styles.copy}>
            <Text style={styles.title}>{betaEvent.title}</Text>
            <Text style={styles.description}>{betaEvent.shortDescription}</Text>
          </View>

          <View style={styles.prizeBlock}>
            <Text style={styles.prizeLabel}>추첨 {betaEvent.winners}</Text>
            <Text style={styles.prize}>{betaEvent.prize}</Text>
          </View>

          <Text style={styles.period}>{betaEvent.entryPeriod}</Text>
          <PrimaryButton label="이벤트 자세히 보기" onPress={openDetails} />
          <Text style={styles.safety}>좋은 후기나 앱스토어 별점을 요구하지 않아요.</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(25, 31, 40, 0.5)',
  },
  dialog: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: palette.surface,
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: space.xxl,
    gap: space.xl,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    borderRadius: 999,
    backgroundColor: palette.brandSoft,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  badgeText: { ...type.caption, color: palette.brand },
  close: { ...type.body, color: palette.muted, paddingVertical: space.sm },
  copy: { gap: space.md },
  title: { ...type.title1, color: palette.ink, letterSpacing: -0.6 },
  description: { ...type.body, color: palette.muted },
  prizeBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    paddingVertical: space.lg,
    gap: space.xs,
  },
  prizeLabel: { ...type.caption, color: palette.muted },
  prize: { ...type.title2, color: palette.ink },
  period: { ...type.caption, color: palette.muted },
  safety: { ...type.caption, color: palette.muted, textAlign: 'center' },
});
