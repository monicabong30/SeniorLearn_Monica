export function scaleTypographyStyle<T extends { fontSize?: number; lineHeight?: number }>(style: T, fontScale: number): T {
  return { ...style, ...(style.fontSize !== undefined ? { fontSize: style.fontSize * fontScale } : {}), ...(style.lineHeight !== undefined ? { lineHeight: style.lineHeight * fontScale } : {}) };
}
