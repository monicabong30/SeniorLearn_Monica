import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'token';
const PROBE_KEY = 'seniorlearn.secure-store-probe';
const PROBE_VALUE = 'ok';

type StorageBackend = 'secure-store' | 'web-async-storage' | 'expo-go-async-storage' | 'unavailable';

export class TokenStorageError extends Error {
  constructor(message = 'Secure token storage is unavailable on this device.') {
    super(message);
    this.name = 'TokenStorageError';
  }
}
export const isTokenStorageError = (error: unknown): error is TokenStorageError => error instanceof TokenStorageError;

let backendPromise: Promise<StorageBackend> | undefined;

// Expo Go is a development client. AsyncStorage is allowed here only when the
// Expo Go native SecureStore module does not match the SDK JS module.
const canUseExpoGoFallback =
  __DEV__ &&
  (Constants.executionEnvironment === 'storeClient' ||
    Constants.appOwnership === 'expo');

function logStorageProblem(action: string, error: unknown) {
  console.warn(`[SeniorLearn auth] ${action} failed; continuing safely.`, error);
}

async function selectBackend(): Promise<StorageBackend> {
  // SecureStore has no web implementation. AsyncStorage uses the browser's
  // persistent storage on web, which is the appropriate session store for the
  // Expo web client.
  if (Platform.OS === 'web') return 'web-async-storage';

  try {
    // isAvailableAsync alone is insufficient here: an out-of-sync Expo Go can
    // expose reads/writes but omit deleteValueWithKeyAsync. Probe all operations
    // before using SecureStore for a real session.
    if (!(await SecureStore.isAvailableAsync())) throw new Error('SecureStore is unavailable');
    await SecureStore.setItemAsync(PROBE_KEY, PROBE_VALUE);
    const value = await SecureStore.getItemAsync(PROBE_KEY);
    await SecureStore.deleteItemAsync(PROBE_KEY);
    if (value !== PROBE_VALUE) throw new Error('SecureStore probe returned an unexpected value');
    return 'secure-store';
  } catch (error) {
    logStorageProblem('SecureStore compatibility check', error);
    return canUseExpoGoFallback ? 'expo-go-async-storage' : 'unavailable';
  }
}

async function backend(): Promise<StorageBackend> {
  backendPromise ??= selectBackend();
  return backendPromise;
}

async function fallbackAfterSecureStoreFailure(action: string, error: unknown): Promise<boolean> {
  logStorageProblem(action, error);
  if (!canUseExpoGoFallback) return false;
  backendPromise = Promise.resolve('expo-go-async-storage');
  return true;
}

/** Reads a token without allowing storage failures to interrupt an API request. */
export async function getToken(): Promise<string | null> {
  const selected = await backend();
  try {
    if (selected === 'secure-store') return await SecureStore.getItemAsync(TOKEN_KEY);
    if (selected === 'web-async-storage' || selected === 'expo-go-async-storage') return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    if (selected === 'secure-store' && await fallbackAfterSecureStoreFailure('SecureStore read', error)) {
      try { return await AsyncStorage.getItem(TOKEN_KEY); } catch (fallbackError) { logStorageProblem('Expo Go token read', fallbackError); }
    } else {
      logStorageProblem('Token read', error);
    }
  }
  return null;
}

/** Persists a token securely, except for the explicit development Expo Go fallback. */
export async function saveToken(token: string): Promise<void> {
  const selected = await backend();
  try {
    if (selected === 'secure-store') return await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (selected === 'web-async-storage' || selected === 'expo-go-async-storage') return await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    if (selected === 'secure-store' && await fallbackAfterSecureStoreFailure('SecureStore write', error)) {
      try { return await AsyncStorage.setItem(TOKEN_KEY, token); }
      catch (fallbackError) { logStorageProblem('Expo Go token write', fallbackError); throw new TokenStorageError(); }
    }
    logStorageProblem('Token write', error);
    throw new TokenStorageError();
  }
  // Production never falls back to AsyncStorage. A login should report this
  // instead of pretending that a durable session was created.
  throw new TokenStorageError();
}

/** Clears a session best-effort so logout and 401 handling can never crash the app. */
export async function clearToken(): Promise<void> {
  const selected = await backend();
  try {
    if (selected === 'secure-store') await SecureStore.deleteItemAsync(TOKEN_KEY);
    else if (selected === 'web-async-storage' || selected === 'expo-go-async-storage') await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    if (selected === 'secure-store' && await fallbackAfterSecureStoreFailure('SecureStore delete', error)) {
      try { await AsyncStorage.removeItem(TOKEN_KEY); } catch (fallbackError) { logStorageProblem('Expo Go token delete', fallbackError); }
    } else {
      logStorageProblem('Token delete', error);
    }
  }
}
