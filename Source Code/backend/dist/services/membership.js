"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasActiveMembership = void 0;
exports.effectiveMembershipStatus = effectiveMembershipStatus;
exports.membershipError = membershipError;
exports.renewalReminder = renewalReminder;
exports.membershipForUser = membershipForUser;
const index_js_1 = require("../models/index.js");
/** Expiry is inclusive: access ends at 00:00 UTC on the day after expiresAt's UTC date. */
function effectiveMembershipStatus(user, membership, now = new Date()) {
    if ((0, index_js_1.isAdmin)(user))
        return 'ADMIN';
    if ((0, index_js_1.userRoles)(user).includes('HONORARY'))
        return 'LIFETIME';
    if (!membership)
        return 'MISSING';
    if (!membership.expiresAt || Number.isNaN(new Date(membership.expiresAt).getTime()))
        return 'INVALID';
    if (membership.status === 'SUSPENDED')
        return 'SUSPENDED';
    if (membership.status === 'PENDING')
        return 'PENDING';
    if (membership.status === 'EXPIRED')
        return 'EXPIRED';
    if (membership.status !== 'ACTIVE')
        return 'INVALID';
    const expiry = new Date(membership.expiresAt);
    const endOfExpiryDate = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate() + 1);
    return now.getTime() < endOfExpiryDate ? 'ACTIVE' : 'EXPIRED';
}
const hasActiveMembership = (user, membership, now = new Date()) => ['ACTIVE', 'LIFETIME', 'ADMIN'].includes(effectiveMembershipStatus(user, membership, now));
exports.hasActiveMembership = hasActiveMembership;
function membershipError(status) {
    const code = status === 'SUSPENDED' ? 'MEMBERSHIP_SUSPENDED' : status === 'PENDING' ? 'MEMBERSHIP_PENDING' : status === 'MISSING' || status === 'INVALID' ? 'MEMBERSHIP_UNAVAILABLE' : 'MEMBERSHIP_EXPIRED';
    const message = status === 'SUSPENDED' ? 'Your membership is suspended. Please contact SeniorLearn Administration.' : status === 'PENDING' ? 'Your membership is pending review. Please contact SeniorLearn Administration.' : status === 'MISSING' || status === 'INVALID' ? 'Your membership record is unavailable. Please contact SeniorLearn Support.' : 'Your membership has expired. Please renew to continue.';
    return { code, message };
}
async function renewalReminder(user, membership) {
    if (!membership || (0, index_js_1.userRoles)(user).includes('HONORARY') || (0, index_js_1.isAdmin)(user) || membership.status === 'SUSPENDED')
        return;
    const now = new Date(), expiry = new Date(membership.expiresAt);
    if (Number.isNaN(+expiry))
        return;
    const days = Math.floor((Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate()) - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 86400000);
    const threshold = days <= 0 ? 'EXPIRED' : days <= 7 ? '7_DAYS' : days <= 30 ? '30_DAYS' : undefined;
    if (!threshold)
        return;
    const type = `MEMBERSHIP_RENEWAL_${threshold}`;
    if (await index_js_1.Notification.exists({ user: user._id, type }))
        return;
    const message = threshold === 'EXPIRED' ? 'Your membership has expired. Renew your membership to restore access.' : `Your membership expires on ${expiry.toLocaleDateString('en-AU', { timeZone: 'UTC' })}. Renew your membership to keep access.`;
    await index_js_1.Notification.create({ user: user._id, title: threshold === 'EXPIRED' ? 'Membership expired' : 'Membership renewal reminder', body: message, type, entity: { kind: 'MEMBERSHIP', label: 'Renew membership' } });
}
async function membershipForUser(user) { return index_js_1.Membership.findOne({ user: user._id }); }
