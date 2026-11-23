"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const membership_js_1 = require("./membership.js");
const standard = { roles: ['STANDARD'] }, honorary = { roles: ['STANDARD', 'HONORARY'] }, admin = { roles: ['STANDARD'], isAdmin: true };
const active = (expiresAt, status = 'ACTIVE') => ({ status, expiresAt });
(0, vitest_1.describe)('effective membership status', () => {
    (0, vitest_1.it)('treats an ACTIVE membership with a past date as expired', () => (0, vitest_1.expect)((0, membership_js_1.effectiveMembershipStatus)(standard, active('2025-01-01'), new Date('2026-01-01T12:00:00Z'))).toBe('EXPIRED'));
    (0, vitest_1.it)('keeps an explicitly EXPIRED membership restricted even when its date is future', () => (0, vitest_1.expect)((0, membership_js_1.effectiveMembershipStatus)(standard, active('2030-01-01', 'EXPIRED'), new Date('2026-01-01'))).toBe('EXPIRED'));
    (0, vitest_1.it)('uses the expiry date through its UTC end date', () => (0, vitest_1.expect)((0, membership_js_1.effectiveMembershipStatus)(standard, active('2026-01-01'), new Date('2026-01-01T23:59:59Z'))).toBe('ACTIVE'));
    (0, vitest_1.it)('handles missing and suspended records safely', () => { (0, vitest_1.expect)((0, membership_js_1.effectiveMembershipStatus)(standard, null)).toBe('MISSING'); (0, vitest_1.expect)((0, membership_js_1.effectiveMembershipStatus)(standard, active('2030-01-01', 'SUSPENDED'))).toBe('SUSPENDED'); });
    (0, vitest_1.it)('exempts honorary and administrators', () => { (0, vitest_1.expect)((0, membership_js_1.effectiveMembershipStatus)(honorary, active('2020-01-01', 'EXPIRED'))).toBe('LIFETIME'); (0, vitest_1.expect)((0, membership_js_1.effectiveMembershipStatus)(admin, active('2020-01-01', 'EXPIRED'))).toBe('ADMIN'); });
});
