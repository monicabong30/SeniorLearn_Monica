import { Membership, Notification, userRoles, isAdmin } from '../models/index.js';

export type EffectiveMembershipStatus = 'ACTIVE'|'EXPIRED'|'PENDING'|'SUSPENDED'|'MISSING'|'INVALID'|'LIFETIME'|'ADMIN';
/** Expiry is inclusive: access ends at 00:00 UTC on the day after expiresAt's UTC date. */
export function effectiveMembershipStatus(user:any, membership:any, now=new Date()): EffectiveMembershipStatus {
  if (isAdmin(user)) return 'ADMIN';
  if (userRoles(user).includes('HONORARY')) return 'LIFETIME';
  if (!membership) return 'MISSING';
  // New memberships do not receive an expiry date until activation.  Treat
  // them as pending rather than invalid while that setup is in progress.
  if (membership.status === 'PENDING') return 'PENDING';
  if (!membership.expiresAt || Number.isNaN(new Date(membership.expiresAt).getTime())) return 'INVALID';
  if (membership.status === 'SUSPENDED') return 'SUSPENDED';
  if (membership.status === 'EXPIRED') return 'EXPIRED';
  if (membership.status !== 'ACTIVE') return 'INVALID';
  const expiry = new Date(membership.expiresAt);
  const endOfExpiryDate = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate() + 1);
  return now.getTime() < endOfExpiryDate ? 'ACTIVE' : 'EXPIRED';
}
export const hasActiveMembership=(user:any,membership:any,now=new Date())=>['ACTIVE','LIFETIME','ADMIN'].includes(effectiveMembershipStatus(user,membership,now));
export function membershipError(status:EffectiveMembershipStatus) {
  const code = status === 'SUSPENDED' ? 'MEMBERSHIP_SUSPENDED' : status === 'PENDING' ? 'MEMBERSHIP_PENDING' : status === 'MISSING' || status === 'INVALID' ? 'MEMBERSHIP_UNAVAILABLE' : 'MEMBERSHIP_EXPIRED';
  const message = status === 'SUSPENDED' ? 'Your membership is suspended. Please contact SeniorLearn Administration.' : status === 'PENDING' ? 'Your membership is pending review. Please contact SeniorLearn Administration.' : status === 'MISSING' || status === 'INVALID' ? 'Your membership record is unavailable. Please contact SeniorLearn Support.' : 'Your membership has expired. Please renew to continue.';
  return { code, message };
}
export async function renewalReminder(user:any, membership:any) {
  if (!membership || userRoles(user).includes('HONORARY') || isAdmin(user) || membership.status === 'SUSPENDED') return;
  const now=new Date(), expiry=new Date(membership.expiresAt); if (Number.isNaN(+expiry)) return;
  const days=Math.floor((Date.UTC(expiry.getUTCFullYear(),expiry.getUTCMonth(),expiry.getUTCDate())-Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()))/86400000);
  const threshold=days<=0?'EXPIRED':days<=7?'7_DAYS':days<=30?'30_DAYS':undefined;
  if (!threshold) return;
  const type=`MEMBERSHIP_RENEWAL_${threshold}`;
  if (await Notification.exists({user:user._id,type})) return;
  const message=threshold==='EXPIRED'?'Your membership has expired. Renew your membership to restore access.':`Your membership expires on ${expiry.toLocaleDateString('en-AU',{timeZone:'UTC'})}. Renew your membership to keep access.`;
  await Notification.create({user:user._id,title:threshold==='EXPIRED'?'Membership expired':'Membership renewal reminder',body:message,type,entity:{kind:'MEMBERSHIP',label:'Renew membership'}});
}
export async function membershipForUser(user:any){ return Membership.findOne({user:user._id}); }
