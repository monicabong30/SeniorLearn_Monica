import React from "react";
import { vi } from "vitest";

// Expo modules reference this compile-time global while loading.
vi.stubGlobal('__DEV__', true);
vi.mock('expo-constants', () => ({ default: { executionEnvironment: 'storeClient', appOwnership: 'expo' } }));

// Vector icons render through native font infrastructure. Keep component tests
// focused on the UI contract while preserving icon names and accessibility props.
vi.mock("@expo/vector-icons", () => ({
  Ionicons: (props: Record<string, unknown>) =>
    React.createElement("Ionicons", props),
}));
vi.mock('expo-secure-store', () => ({ isAvailableAsync: vi.fn(async () => true), getItemAsync: vi.fn(async () => null), setItemAsync: vi.fn(async () => undefined), deleteItemAsync: vi.fn(async () => undefined) }));
// Tests do not load Expo's .env handling. This is public, local-only test configuration.
process.env.EXPO_PUBLIC_API_URL ??= 'http://localhost:4000/api';
