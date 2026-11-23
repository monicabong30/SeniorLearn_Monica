import { NextFunction, Request, Response } from 'express'; import jwt from 'jsonwebtoken'; import { isAdmin, MembershipRole, User, userRoles } from '../models/index.js'; import { membershipError, effectiveMembershipStatus, membershipForUser } from '../services/membership.js';
export interface AuthRequest extends Request { auth?: { id: string }; user?: any }
/** JWT proves identity only. Persisted permissions are loaded for every protected request. */
export const auth = async (req: AuthRequest,res: Response,next: NextFunction) => { const token=req.header('Authorization')?.replace('Bearer ',''); if(!token) return res.status(401).json({error:'Authentication required'}); try { const payload=jwt.verify(token, process.env.JWT_SECRET!) as {id:string}; const user=await User.findById(payload.id); if(!user)return res.status(401).json({error:'Authentication required'}); req.auth={id:String(user._id)};req.user=user;next(); } catch { res.status(401).json({error:'Invalid or expired token'}); } };
export const hasRole=(user:any, role:MembershipRole)=>userRoles(user).includes(role);
export const hasAdminAccess=(user:any)=>isAdmin(user);
export const permit = (...roles: Array<MembershipRole | 'ADMIN'>) => (req: AuthRequest,res:Response,next:NextFunction) => {
  // Administrators retain access to membership-protected operations, while a
  // route containing only ADMIN remains administrator-only.
  const allowed = req.user && (hasAdminAccess(req.user) || roles.some(role=>role !== 'ADMIN' && hasRole(req.user,role)));
  return allowed ? next() : res.status(403).json({error:'Permission denied'});
};
export const requireActiveMembership = async (req: AuthRequest,res: Response,next: NextFunction) => {
  try { const membership=await membershipForUser(req.user); const status=effectiveMembershipStatus(req.user,membership);
    if (['ACTIVE','LIFETIME','ADMIN'].includes(status)) return next();
    return res.status(403).json(membershipError(status));
  } catch (error) { return next(error); }
};
