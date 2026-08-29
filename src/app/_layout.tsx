import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';

import { palette } from '@/constants/product-theme';
import { FirstRunGuide } from '@/components/first-run-guide';
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
      </Stack>
      <FirstRunGuide />
    </AppStateProvider>
  );
}
