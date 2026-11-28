import type { ExpoConfig } from 'expo/config';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

function parsedApiUrl(value: string | undefined): URL | undefined {
  try { return value ? new URL(value) : undefined; } catch { return undefined; }
}

const parsedUrl = parsedApiUrl(apiUrl);
if (!parsedUrl || parsedUrl.protocol !== 'https:') {
  throw new Error('EXPO_PUBLIC_API_URL must be a valid HTTPS URL for the SeniorLearn assessment APK.');
}

const config: ExpoConfig = {
  name: 'SeniorLearn', slug: 'seniorlearn', version: '1.0.0', scheme: 'seniorlearn',
  icon: './assets/images/SeniorLearn_logo.png',
  plugins: ['expo-router', './plugins/withCleartextTraffic'], orientation: 'default', userInterfaceStyle: 'light',
  android: {
    package: 'com.seniorlearn.app', versionCode: 1, softwareKeyboardLayoutMode: 'resize', allowBackup: false,
    adaptiveIcon: { foregroundImage: './assets/images/SeniorLearn_logo.png', backgroundColor: '#FFFFFF' },
  },
  extra: {
    eas: { projectId: '912fe583-abed-4cf1-90ed-05b285f56fac' },
    apiUrl: apiUrl || null
  }
};
export default config;
