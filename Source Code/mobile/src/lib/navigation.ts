import type { Role } from './permissions';
import { canTutor } from './permissions';

export const classesTabRoute = 'index';

export const appRoutes = {
  enrolments: '/enrolments',
  favourites: '/favourites',
  tutor: '/tutor',
  index: '/(tabs)',
  help: '/help',
  profile: '/profile',
  bulletins: '/bulletins',
  notifications: '/notifications',
  adminDashboard: '/(tabs)/admin',
  adminMembers: '/admin/members',
  adminClasses: '/admin/classes',
  adminBulletins: '/admin/bulletins',
} as const;

export type BottomTabSlot = 'enrolments' | 'tutor' | 'admin' | 'favourites' | 'index' | 'help' | 'profile';
export type AdminTabSlot = 'adminMembers' | 'adminClasses' | 'admin' | 'adminBulletins' | 'profile';
export type NavigationSlot = BottomTabSlot | AdminTabSlot;

/** The visual slots are deliberately stable so Classes always occupies slot three. */
export function bottomTabSlots(role?: Role | string | {roles?: any[];isAdmin?:boolean;role?:string} | null): BottomTabSlot[] {
  return ['enrolments', (typeof role==='string' ? role==='ADMIN' : role?.isAdmin) ? 'admin' : canTutor(role as any) ? 'tutor' : 'favourites', 'index', 'help', 'profile'];
}

/** Administrators get task-first navigation; authorization is still enforced by route guards. */
export function adminTabSlots(): AdminTabSlot[] {
  return ['adminMembers', 'adminClasses', 'admin', 'adminBulletins', 'profile'];
}

export function adminTabRoute(slot: AdminTabSlot) {
  return ({ admin: appRoutes.adminDashboard, adminMembers: appRoutes.adminMembers, adminClasses: appRoutes.adminClasses, adminBulletins: appRoutes.adminBulletins, profile: appRoutes.profile })[slot];
}

export function activeAdminTab(pathname: string): AdminTabSlot {
  if (pathname.startsWith('/admin/members') || pathname.startsWith('/admin/member') || pathname.startsWith('/admin/edit-member')) return 'adminMembers';
  if (pathname.startsWith('/admin/classes') || pathname.startsWith('/admin/class')) return 'adminClasses';
  if (pathname.startsWith('/admin/bulletins') || pathname.startsWith('/admin/create-bulletin')) return 'adminBulletins';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'admin';
}

export function authenticatedEntryPath(isAuthenticated: boolean) {
  return isAuthenticated ? '/(tabs)' : '/(auth)/login';
}

/** `navigateToTab` accepts a navigator route key, never a route name. */
export function tabRouteKey(routes: Array<{ key: string; name: string }>, name: BottomTabSlot) {
  return routes.find(route => route.name === name)?.key;
}
