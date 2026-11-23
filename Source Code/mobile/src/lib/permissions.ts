export type MembershipRole='STANDARD'|'PROFESSIONAL'|'HONORARY';
export type Role=MembershipRole|'ADMIN';
export type RoleUser={roles?: MembershipRole[]; isAdmin?: boolean; role?: Role | string};
const legacyRoles=(role?: string): MembershipRole[] => role==='PROFESSIONAL'?['STANDARD','PROFESSIONAL']:role==='HONORARY'?['STANDARD','HONORARY']:['STANDARD'];
export const rolesOf=(value?: RoleUser | Role | string | null): MembershipRole[] => typeof value==='string'?legacyRoles(value):value?.roles?.includes('STANDARD')?[...new Set(value.roles)]:legacyRoles(value?.role);
export const hasRole=(value: RoleUser | Role | string | null | undefined, role: MembershipRole)=>rolesOf(value).includes(role);
export const canAdmin=(value?:RoleUser|Role|string|null)=>typeof value==='string'?value==='ADMIN':!!value?.isAdmin||value?.role==='ADMIN';
export const canTutor=(value?:RoleUser|Role|string|null)=>canAdmin(value)||hasRole(value,'PROFESSIONAL');
export const canEnrol=(value?:RoleUser|Role|string|null)=>canAdmin(value)||hasRole(value,'STANDARD');
