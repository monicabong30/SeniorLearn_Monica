"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.asyncRoute = void 0;
const zod_1 = require("zod");
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.asyncRoute = asyncRoute;
const errorHandler = (err, _req, res, _next) => { if (err instanceof zod_1.ZodError)
    return res.status(400).json({ error: 'Validation failed', details: err.flatten().fieldErrors }); if (err?.code === 11000)
    return res.status(409).json({ error: 'This email is already registered.' }); const status = Number(err?.status) || 500; if (status >= 500)
    console.error(err); return res.status(status).json({ error: status >= 500 ? 'Unexpected server error' : err.message || 'Request failed', ...(err?.code && err.code !== 11000 ? { code: err.code } : {}) }); };
exports.errorHandler = errorHandler;
