"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetLoginRateLimitForTests = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const api_js_1 = __importDefault(require("./routes/api.js"));
const openapi_js_1 = require("./openapi.js");
const http_js_1 = require("./utils/http.js");
const app = (0, express_1.default)();
const origins = (process.env.CLIENT_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production' && origins.length === 0)
    throw new Error('CLIENT_ORIGIN is required in production.');
const corsOptions = { origin: (origin, callback) => {
        if (!origin || origins.includes(origin) || (process.env.NODE_ENV !== 'production' && origins.length === 0))
            return callback(null, true);
        return callback(new Error('Origin is not allowed by CORS'));
    }, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'], optionsSuccessStatus: 204 };
const loginAttempts = new Map();
/** Test-only helper; it is not exposed through an HTTP route. */
const resetLoginRateLimitForTests = () => loginAttempts.clear();
exports.resetLoginRateLimitForTests = resetLoginRateLimitForTests;
const loginRateLimit = (req, res, next) => { const key = req.ip || 'unknown', now = Date.now(), entry = loginAttempts.get(key); if (!entry || entry.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return next();
} entry.count++; if (entry.count > 10) {
    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
    return res.status(429).json({ error: 'Too many sign-in attempts. Please try again later.' });
} next(); };
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true')
    app.set('trust proxy', 1);
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '1mb' }));
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/ready', (_req, res) => { const connected = mongoose_1.default.connection.readyState === 1; res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'unavailable' }); });
app.use('/api/auth/login', loginRateLimit);
app.use('/api', api_js_1.default);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi_js_1.openapi, { swaggerOptions: { persistAuthorization: true } }));
app.use(http_js_1.errorHandler);
exports.default = app;
