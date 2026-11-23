export const TEXT_SCALE_MIN = 0.7;
export const TEXT_SCALE_MAX = 1.3;
export const TEXT_SCALE_DEFAULT = 1;
export const TEXT_SCALE_STEP = 0.05;

export function normalizeTextScale(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return TEXT_SCALE_DEFAULT;
  const stepped = Math.round(value / TEXT_SCALE_STEP) * TEXT_SCALE_STEP;
  return Math.min(TEXT_SCALE_MAX, Math.max(TEXT_SCALE_MIN, Number(stepped.toFixed(2))));
}

export function normalizeStoredPreferences(value: unknown) {
  const saved = value && typeof value === 'object' ? value as { fontScale?: unknown; classFilter?: unknown } : {};
  const preferences = { fontScale: normalizeTextScale(saved.fontScale), classFilter: typeof saved.classFilter === 'string' ? saved.classFilter : '' };
  return { preferences, migrated: saved.fontScale !== preferences.fontScale || saved.classFilter !== preferences.classFilter };
}
