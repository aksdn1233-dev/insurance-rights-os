import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';

import { palette } from '@/constants/product-theme';
import { FirstRunGuide } from '@/components/first-run-guide';
import { BetaEventNotice } from '@/components/beta-event-notice';
import { AppStateProvider } from '@/state/app-state';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  return (
    <AppStateProvider>
      <Head>
        <title>보험의 달인 · 놓치기 쉬운 보험 혜택 찾기</title>
        <meta
          name="description"
          content="보험의 달인에서 받은 치료로 확인할 보험 혜택과 필요한 서류를 쉽게 살펴보세요."
        />
        <link rel="canonical" href="https://insurance-rights-korea.pages.dev/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="보험의 달인" />
        <meta
          property="og:description"
          content="받은 치료를 고르면 내 보험에서 확인할 혜택과 근거, 필요한 서류를 쉽게 알려드려요."
        />
        <meta property="og:url" content="https://insurance-rights-korea.pages.dev/" />
        <meta
          property="og:image"
          content="https://insurance-rights-korea.pages.dev/insurance-master-launch-4x5.png"
        />
      </Head>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.canvas },
          headerShadowVisible: false,
          headerTintColor: palette.ink,
          contentStyle: { backgroundColor: palette.canvas },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="claim-flow"
          options={{ title: '보험 확인', presentation: 'modal', headerBackTitle: '홈' }}
        />
        <Stack.Screen
          name="refund-check"
          options={{ title: '환급금 확인', presentation: 'modal', headerBackTitle: '홈' }}
        />
        <Stack.Screen
          name="privacy"
          options={{ title: '개인정보·이용 안내', presentation: 'modal', headerBackTitle: '내 보험' }}
        />
        <Stack.Screen
          name="event"
          options={{ title: '공개 베타 이벤트', presentation: 'modal', headerBackTitle: '홈' }}
        />
        <Stack.Screen
          name="feedback"
          options={{ title: '후기·개선점 보내기', presentation: 'modal', headerBackTitle: '홈' }}
        />
      </Stack>
      <FirstRunGuide />
      <BetaEventNotice />
    </AppStateProvider>
  );
}
