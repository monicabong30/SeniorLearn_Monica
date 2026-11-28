import { Platform } from 'react-native';

/** A small, platform-neutral design system used by every SeniorLearn screen. */
export const colors = {
  primary: '#007AFF', primaryPressed: '#0066D6', secondary: '#EAF3FF',
  background: '#FFFFFF', surface: '#FFFFFF', elevatedSurface: '#F8FAFC',
  text: '#111827', textSecondary: '#4B5563', border: '#D9E1EA', separator: '#E8EDF2',
  success: '#16834B', error: '#C9362B', warning: '#8A5A00', info: '#075985', disabled: '#6B7280',
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, display: 40, hero: 48 } as const;
export const type = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  page: { fontSize: 27, lineHeight: 34, fontWeight: '700' as const },
  section: { fontSize: 21, lineHeight: 28, fontWeight: '700' as const },
  body: { fontSize: 17, lineHeight: 25 }, secondary: { fontSize: 15, lineHeight: 22 }, caption: { fontSize: 14, lineHeight: 20 },
};
export const radius = { sm: 10, md: 14, lg: 18, pill: 999 } as const;
export const iconSize = { small: 16, standard: 20, input: 22, navigation: 24, status: 32 } as const;
export const motion = { quick: 160, standard: 240, modal: 320 } as const;
export const fonts = { body: 'System', heading: 'System', fallback: 'System' } as const;
export const shadow = Platform.select({ web: { boxShadow: '0 2px 12px rgba(15, 23, 42, 0.06)' }, default: { elevation: 1, shadowColor: '#1D1D1F', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } } })!;
