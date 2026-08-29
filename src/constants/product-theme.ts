import { Platform } from 'react-native';

export const palette = {
  canvas: '#F7F8FA',
  surface: '#FFFFFF',
  ink: '#191F28',
  muted: '#6B7684',
  line: '#E5E8EB',
  brand: '#3182F6',
  brandSoft: '#E8F3FF',
  info: '#4E5968',
  infoSoft: '#F2F4F6',
  warning: '#B35C00',
  warningSoft: '#FFF3E0',
  danger: '#E64B3C',
  dangerSoft: '#FFF0EE',
  white: '#FFFFFF',
} as const;

export const type = {
  family: Platform.select({ ios: 'system-ui', android: 'sans-serif', default: 'system-ui' }),
  display: { fontSize: 32, lineHeight: 41, fontWeight: '700' as const },
  title1: { fontSize: 26, lineHeight: 34, fontWeight: '700' as const },
  title2: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '700' as const },
  caption: { fontSize: 13, lineHeight: 19, fontWeight: '500' as const },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 32, xxxl: 40 } as const;
