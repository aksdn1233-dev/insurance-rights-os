import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Text, type ColorValue } from 'react-native';

import { palette } from '@/constants/product-theme';

type IconName = {
  ios: 'house.fill' | 'person.2.fill' | 'cross.case.fill' | 'shield.lefthalf.filled';
  android: 'home' | 'family_restroom' | 'local_hospital' | 'health_and_safety';
  web: 'home' | 'family_restroom' | 'local_hospital' | 'health_and_safety';
};

function TabIcon({ name, color, fallback }: { name: IconName; color: ColorValue; fallback: string }) {
  return (
    <SymbolView
      name={name}
      tintColor={color}
      size={22}
      fallback={<Text style={{ color, fontSize: 18 }}>{fallback}</Text>}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.brand,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarAccessibilityLabel: '홈 탭',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} fallback="⌂" name={{ ios: 'house.fill', android: 'home', web: 'home' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: '가족',
          tabBarAccessibilityLabel: '가족 탭',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} fallback="○" name={{ ios: 'person.2.fill', android: 'family_restroom', web: 'family_restroom' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="hospital"
        options={{
          title: '병원',
          tabBarAccessibilityLabel: '병원 탭',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} fallback="＋" name={{ ios: 'cross.case.fill', android: 'local_hospital', web: 'local_hospital' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="insurance"
        options={{
          title: '내 보험',
          tabBarAccessibilityLabel: '내 보험 탭',
          tabBarIcon: ({ color }) => (
            <TabIcon
              color={color}
              fallback="◇"
              name={{ ios: 'shield.lefthalf.filled', android: 'health_and_safety', web: 'health_and_safety' }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
