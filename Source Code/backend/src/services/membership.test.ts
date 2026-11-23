import { describe, expect, it } from 'vitest'; import { effectiveMembershipStatus } from './membership.js';
const standard={roles:['STANDARD']}, honorary={roles:['STANDARD','HONORARY']}, admin={roles:['STANDARD'],isAdmin:true};
const active=(expiresAt:string,status='ACTIVE')=>({status,expiresAt});
describe('effective membership status',()=>{
 it('treats an ACTIVE membership with a past date as expired',()=>expect(effectiveMembershipStatus(standard,active('2025-01-01'),new Date('2026-01-01T12:00:00Z'))).toBe('EXPIRED'));
 it('keeps an explicitly EXPIRED membership restricted even when its date is future',()=>expect(effectiveMembershipStatus(standard,active('2030-01-01','EXPIRED'),new Date('2026-01-01'))).toBe('EXPIRED'));
 it('uses the expiry date through its UTC end date',()=>expect(effectiveMembershipStatus(standard,active('2026-01-01'),new Date('2026-01-01T23:59:59Z'))).toBe('ACTIVE'));
 it('handles missing and suspended records safely',()=>{expect(effectiveMembershipStatus(standard,null)).toBe('MISSING');expect(effectiveMembershipStatus(standard,active('2030-01-01','SUSPENDED'))).toBe('SUSPENDED')});
 it('exempts honorary and administrators',()=>{expect(effectiveMembershipStatus(honorary,active('2020-01-01','EXPIRED'))).toBe('LIFETIME');expect(effectiveMembershipStatus(admin,active('2020-01-01','EXPIRED'))).toBe('ADMIN')});
});
