import { describe, expect, it } from 'vitest';
import { scaleTypographyStyle } from './typography';

describe('scaled typography', () => {
  it('uses the saved maximum scale once for font size and line height', () => {
    expect(scaleTypographyStyle({ fontSize: 20, lineHeight: 28, color: 'navy' }, 1.3)).toEqual({ fontSize: 26, lineHeight: 36.4, color: 'navy' });
  });
  it('supports the minimum scale without changing non-typographic styles', () => {
    expect(scaleTypographyStyle({ fontSize: 20, padding: 8 }, 0.7)).toEqual({ fontSize: 14, padding: 8 });
  });
});
