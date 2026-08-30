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
        <title>권리찾기 · 보험을 쉽게 확인해요</title>
        <meta
          name="description"
          content="놓치기 쉬운 보험 권리를 약관 근거와 필요한 서류까지 쉽게 확인하는 서비스"
        />
        <link rel="canonical" href="https://insurance-rights-korea.pages.dev/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="내 보험 권리 찾기" />
        <meta
          property="og:description"
          content="받은 치료를 고르면 확인할 보험 후보와 근거, 필요한 서류를 쉽게 알려드려요."
        />
        <meta property="og:url" content="https://insurance-rights-korea.pages.dev/" />
        <meta
          property="og:image"
          content="https://insurance-rights-korea.pages.dev/insurance-rights-launch-4x5.png"
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
