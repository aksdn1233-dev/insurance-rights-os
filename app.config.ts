import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const baseUrl = process.env.EXPO_DEPLOY_BASE_URL;

  return {
    ...config,
    name: config.name ?? '권리찾기',
    slug: config.slug ?? 'insurance-rights-os',
    experiments: {
      ...config.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  };
};
