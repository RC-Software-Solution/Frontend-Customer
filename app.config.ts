import type { ConfigContext, ExpoConfig } from 'expo/config';

// A tester or store build must never be bundled against a missing or plaintext API URL.
// EAS sets EAS_BUILD_PROFILE (and the profile's env from eas.json) while it evaluates this file.
export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const url = process.env.EXPO_PUBLIC_API_URL ?? '';
  if (profile && !url.startsWith('https://')) {
    throw new Error(`EAS profile "${profile}" needs EXPO_PUBLIC_API_URL to be an https:// URL (got "${url}")`);
  }
  return config as ExpoConfig;
};
