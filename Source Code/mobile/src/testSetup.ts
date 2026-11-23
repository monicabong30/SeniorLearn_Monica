import React from "react";
import { vi } from "vitest";

// Vector icons render through native font infrastructure. Keep component tests
// focused on the UI contract while preserving icon names and accessibility props.
vi.mock("@expo/vector-icons", () => ({
  Ionicons: (props: Record<string, unknown>) =>
    React.createElement("Ionicons", props),
}));
// Tests do not load Expo's .env handling. This is public, local-only test configuration.
process.env.EXPO_PUBLIC_API_URL ??= 'http://localhost:4000/api';
