import { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, space, type } from '@/constants/product-theme';

export function Page({
  children,
  contentStyle,
  loading = false,
}: PropsWithChildren<{ contentStyle?: StyleProp<ViewStyle>; loading?: boolean }>) {
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={palette.brand} />
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.page, contentStyle]}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function TestDataBanner() {
  return (
    <View style={styles.testBanner} accessibilityLabel="연습용 화면 사용 중">
      <Text style={styles.testBannerText}>연습용 화면이에요 · 실제 청구는 되지 않아요</Text>
    </View>
  );
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Title({ children }: PropsWithChildren) {
  return <Text style={styles.title}>{children}</Text>;
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
    </View>
  );
}

export function Surface({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={12}>
      <Text style={styles.textButton}>{label}</Text>
    </Pressable>
  );
}

export function StatusPill({
  children,
  tone = 'brand',
}: PropsWithChildren<{ tone?: 'brand' | 'info' | 'warning' | 'danger' }>) {
  const backgroundStyle = {
    brand: styles.pillBrand,
    info: styles.pillInfo,
    warning: styles.pillWarning,
    danger: styles.pillDanger,
  }[tone];
  const textStyle = {
    brand: styles.pillTextBrand,
    info: styles.pillTextInfo,
    warning: styles.pillTextWarning,
    danger: styles.pillTextDanger,
  }[tone];
  return (
    <View style={[styles.pill, backgroundStyle]}>
      <Text style={[styles.pillText, textStyle]}>{children}</Text>
    </View>
  );
}

export function DetailRow({
  title,
  detail,
  trailing,
  last = false,
}: {
  title: string;
  detail?: string;
  trailing?: ReactNode;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

export function ActionRow({
  title,
  detail,
  actionLabel,
  onPress,
  last = false,
}: {
  title: string;
  detail?: string;
  actionLabel: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title}, ${actionLabel}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && styles.actionRowPressed]}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <View style={styles.actionLabelWrap}>
        <Text style={styles.actionLabel}>{actionLabel}</Text>
        <Text style={styles.actionChevron} accessibilityElementsHidden>›</Text>
      </View>
    </Pressable>
  );
}

export function ProgressLine({ value }: { value: number }) {
  return (
    <View
      style={styles.progressTrack}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: value }}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.canvas },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  page: { paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: 120, gap: space.xxxl },
  testBanner: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.warningSoft,
  },
  testBannerText: { ...type.caption, color: palette.warning, fontSize: 12 },
  eyebrow: { ...type.caption, color: palette.brand, letterSpacing: -0.1 },
  title: { ...type.display, color: palette.ink, fontFamily: type.family, letterSpacing: -0.8 },
  sectionHeader: { gap: 5 },
  sectionTitle: { ...type.title2, color: palette.ink, fontFamily: type.family, letterSpacing: -0.3 },
  sectionDescription: { ...type.body, color: palette.muted, fontFamily: type.family },
  surface: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 22,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  primaryButtonText: { ...type.bodyStrong, color: palette.white, fontFamily: type.family },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  secondaryButtonText: { ...type.bodyStrong, color: palette.ink, fontFamily: type.family },
  textButton: { ...type.bodyStrong, color: palette.brand, paddingVertical: space.sm },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.995 }] },
  buttonDisabled: { opacity: 0.38 },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { ...type.caption, fontFamily: type.family },
  pillBrand: { backgroundColor: palette.brandSoft },
  pillInfo: { backgroundColor: palette.infoSoft },
  pillWarning: { backgroundColor: palette.warningSoft },
  pillDanger: { backgroundColor: palette.dangerSoft },
  pillTextBrand: { color: palette.brand },
  pillTextInfo: { color: palette.info },
  pillTextWarning: { color: palette.warning },
  pillTextDanger: { color: palette.danger },
  row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { ...type.bodyStrong, color: palette.ink, fontFamily: type.family },
  rowDetail: { ...type.caption, color: palette.muted, fontFamily: type.family },
  actionRowPressed: { opacity: 0.55 },
  actionLabelWrap: { alignItems: 'flex-end', gap: 1, maxWidth: 92 },
  actionLabel: { ...type.caption, color: palette.brand, fontFamily: type.family, textAlign: 'right' },
  actionChevron: { color: palette.brand, fontSize: 20, lineHeight: 20 },
  progressTrack: { height: 7, borderRadius: 999, backgroundColor: palette.line, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: palette.brand },
});
