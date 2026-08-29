import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/product-ui';
import { firstRunGuideSlides } from '@/content/first-run-guide';
import { palette, space, type } from '@/constants/product-theme';
import { useAppState } from '@/state/app-state';

export function FirstRunGuide() {
  const { hydrated, guideSeen, completeFirstRunGuide } = useAppState();
  const [step, setStep] = useState(0);
  const slide = firstRunGuideSlides[step];
  const isLast = step === firstRunGuideSlides.length - 1;
  const closeGuide = () => {
    setStep(0);
    completeFirstRunGuide();
  };

  if (!hydrated || guideSeen) return null;

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" statusBarTranslucent={false}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Text style={styles.topLabel}>처음 안내</Text>
          <Pressable
            accessibilityRole="button"
            onPress={closeGuide}
            hitSlop={12}>
            <Text style={styles.skip}>건너뛰기</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.visual}>
            <View style={styles.numberCircle}>
              <Text style={styles.number}>{step + 1}</Text>
            </View>
            <Text style={styles.tabName}>{slide.tab}</Text>
          </View>

          <View style={styles.copy}>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>

          <View style={styles.hintBox}>
            <Text style={styles.hintLabel}>기억해두세요</Text>
            <Text style={styles.hint}>{slide.hint}</Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.dots} accessibilityLabel={`${step + 1}/${firstRunGuideSlides.length} 안내`}>
            {firstRunGuideSlides.map((item, index) => (
              <View key={item.tab} style={[styles.dot, index === step && styles.dotActive]} />
            ))}
          </View>
          <PrimaryButton
            label={isLast ? '시작하기' : '다음'}
            onPress={() => {
              if (isLast) closeGuide();
              else setStep((current) => current + 1);
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.canvas },
  topBar: {
    height: 64,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLabel: { ...type.bodyStrong, color: palette.ink },
  skip: { ...type.body, color: palette.muted, paddingVertical: space.sm },
  content: { flex: 1, paddingHorizontal: space.xl, justifyContent: 'center', gap: 36 },
  visual: { alignItems: 'center', gap: space.lg },
  numberCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brandSoft,
  },
  number: { fontSize: 44, lineHeight: 52, fontWeight: '700', color: palette.brand },
  tabName: { ...type.bodyStrong, color: palette.brand },
  copy: { gap: space.lg },
  title: { ...type.display, color: palette.ink, letterSpacing: -0.8 },
  description: { ...type.body, color: palette.muted, fontSize: 17, lineHeight: 27 },
  hintBox: { backgroundColor: palette.surface, borderRadius: 20, padding: space.xl, gap: 5 },
  hintLabel: { ...type.caption, color: palette.brand },
  hint: { ...type.bodyStrong, color: palette.ink },
  bottom: { paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.line },
  dotActive: { width: 20, backgroundColor: palette.brand },
});
