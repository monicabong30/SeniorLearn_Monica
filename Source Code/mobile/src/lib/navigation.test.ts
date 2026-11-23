import { describe, expect, it } from 'vitest';
import { activeAdminTab, adminTabRoute, adminTabSlots, appRoutes, authenticatedEntryPath, bottomTabSlots, classesTabRoute, tabRouteKey } from './navigation';

describe('authenticated navigation', () => {
  it.each(['STANDARD', 'PROFESSIONAL', 'HONORARY', 'ADMIN'])('%s retains the Classes route', role => {
    expect(bottomTabSlots(role)[2]).toBe(classesTabRoute);
    expect(authenticatedEntryPath(true)).toBe('/(tabs)');
  });

  it('uses Favourites in the second slot when Tutor is not authorised', () => {
    expect(bottomTabSlots('STANDARD')[1]).toBe('favourites');
    expect(bottomTabSlots('HONORARY')[1]).toBe('favourites');
  });

  it('shows the role-specific management tab and keeps login protected', () => {
    expect(bottomTabSlots('PROFESSIONAL')[1]).toBe('tutor');
    expect(bottomTabSlots('ADMIN')[1]).toBe('admin');
    expect(authenticatedEntryPath(false)).toBe('/(auth)/login');
  });

  it('uses task-first admin navigation ahead of every membership role', () => {
    expect(bottomTabSlots({ isAdmin: true, roles: ['STANDARD', 'PROFESSIONAL'] })).toEqual(['enrolments', 'admin', 'index', 'help', 'profile']);
    expect(adminTabSlots()).toEqual(['adminMembers', 'adminClasses', 'admin', 'adminBulletins', 'profile']);
    expect(adminTabRoute('adminMembers')).toBe('/admin/members');
    expect(adminTabRoute('adminClasses')).toBe('/admin/classes');
    expect(adminTabRoute('adminBulletins')).toBe('/admin/bulletins');
  });

  it('highlights the appropriate admin section for nested screens', () => {
    expect(activeAdminTab('/admin/member')).toBe('adminMembers');
    expect(activeAdminTab('/admin/edit-member')).toBe('adminMembers');
    expect(activeAdminTab('/admin/class')).toBe('adminClasses');
    expect(activeAdminTab('/admin/create-bulletin')).toBe('adminBulletins');
    expect(activeAdminTab('/profile')).toBe('profile');
  });

  it('resolves the current route key and never uses a route name as a fallback', () => {
    const routes = [{ name: 'favourites', key: 'favourites-9' }, { name: 'index', key: 'index-2' }];
    expect(tabRouteKey(routes, 'favourites')).toBe('favourites-9');
    expect(tabRouteKey(routes, 'help')).toBeUndefined();
  });

  it('uses independent public paths for authenticated header shortcuts', () => {
    expect(appRoutes.bulletins).toBe('/bulletins');
    expect(appRoutes.notifications).toBe('/notifications');
    expect(appRoutes.bulletins).not.toBe(appRoutes.enrolments);
    expect(appRoutes.notifications).not.toBe(appRoutes.enrolments);
  });
});
