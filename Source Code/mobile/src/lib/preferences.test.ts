import { describe, expect, it } from 'vitest';
import { normalizeStoredPreferences, normalizeTextScale, TEXT_SCALE_DEFAULT, TEXT_SCALE_MAX, TEXT_SCALE_MIN, TEXT_SCALE_STEP } from './preferences';

describe('text-size preferences', () => {
  it('uses the centralized 0.7–1.3 range, 1.0 default, and 0.05 step', () => expect([TEXT_SCALE_MIN, TEXT_SCALE_MAX, TEXT_SCALE_DEFAULT, TEXT_SCALE_STEP]).toEqual([0.7, 1.3, 1, 0.05]));
  it.each([[0.65, 0.7], [1.5, 1.3], ['invalid', 1], [undefined, 1]])('normalizes %s to %s', (saved, expected) => expect(normalizeTextScale(saved)).toBe(expected));
  it('marks a legacy stored value for persistence after migration', () => expect(normalizeStoredPreferences({fontScale:0.65,classFilter:'online'})).toEqual({preferences:{fontScale:0.7,classFilter:'online'},migrated:true}));
});
