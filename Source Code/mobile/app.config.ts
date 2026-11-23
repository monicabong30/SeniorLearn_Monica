import type { ExpoConfig } from 'expo/config';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '::1' || host.endsWith('.local') || /^127\./.test(host)) return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [first, second] = ipv4.slice(1).map(Number);
  return first === 10 || first === 127 || (first === 192 && second === 168) || (first === 172 && second >= 16 && second <= 31);
}

function parsedApiUrl(value: string | undefined): URL | undefined {
  try { return value ? new URL(value) : undefined; } catch { return undefined; }
}

const parsedUrl = parsedApiUrl(apiUrl);
if (!parsedUrl || parsedUrl.protocol !== 'http:' || !isPrivateOrLocalHost(parsedUrl.hostname)) {
  throw new Error('EXPO_PUBLIC_API_URL must be an HTTP local or private-network API URL for the SeniorLearn APK.');
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
