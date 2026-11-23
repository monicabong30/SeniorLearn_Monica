import { Platform } from 'react-native';

/** SeniorLearn's existing navy identity, organised into reusable UI tokens. */
export const colors = {
  primary: '#003366', primaryPressed: '#00284f', secondary: '#0b6e69',
  background: '#F5F5F7', surface: '#FFFFFF', elevatedSurface: '#FFFFFF',
  text: '#1D1D1F', textSecondary: '#6E6E73', border: '#E5E5EA',
  success: '#248A55', error: '#D92D20', warning: '#8A5A00', info: '#155E9D', disabled: '#8E8E93',
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, display: 40, hero: 48 } as const;
export const type = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  page: { fontSize: 27, lineHeight: 34, fontWeight: '700' as const },
  section: { fontSize: 21, lineHeight: 28, fontWeight: '700' as const },
  body: { fontSize: 17, lineHeight: 25 }, secondary: { fontSize: 15, lineHeight: 22 }, caption: { fontSize: 14, lineHeight: 20 },
};
export const shadow = Platform.select({ web: { boxShadow: '0 2px 10px rgba(29, 29, 31, 0.06)' }, default: { elevation: 2, shadowColor: '#1D1D1F', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } } })!;
