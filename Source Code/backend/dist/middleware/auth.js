"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveMembership = exports.permit = exports.hasAdminAccess = exports.hasRole = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../models/index.js");
const membership_js_1 = require("../services/membership.js");
/** JWT proves identity only. Persisted permissions are loaded for every protected request. */
const auth = async (req, res, next) => { const token = req.header('Authorization')?.replace('Bearer ', ''); if (!token)
    return res.status(401).json({ error: 'Authentication required' }); try {
    const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    const user = await index_js_1.User.findById(payload.id);
    if (!user)
        return res.status(401).json({ error: 'Authentication required' });
    req.auth = { id: String(user._id) };
    req.user = user;
    next();
}
catch {
    res.status(401).json({ error: 'Invalid or expired token' });
} };
exports.auth = auth;
const hasRole = (user, role) => (0, index_js_1.userRoles)(user).includes(role);
exports.hasRole = hasRole;
const hasAdminAccess = (user) => (0, index_js_1.isAdmin)(user);
exports.hasAdminAccess = hasAdminAccess;
const permit = (...roles) => (req, res, next) => {
    // Administrators retain access to membership-protected operations, while a
    // route containing only ADMIN remains administrator-only.
    const allowed = req.user && ((0, exports.hasAdminAccess)(req.user) || roles.some(role => role !== 'ADMIN' && (0, exports.hasRole)(req.user, role)));
    return allowed ? next() : res.status(403).json({ error: 'Permission denied' });
};
exports.permit = permit;
const requireActiveMembership = async (req, res, next) => {
    try {
        const membership = await (0, membership_js_1.membershipForUser)(req.user);
        const status = (0, membership_js_1.effectiveMembershipStatus)(req.user, membership);
        if (['ACTIVE', 'LIFETIME', 'ADMIN'].includes(status))
            return next();
        return res.status(403).json((0, membership_js_1.membershipError)(status));
    }
    catch (error) {
        return next(error);
    }
};
exports.requireActiveMembership = requireActiveMembership;
