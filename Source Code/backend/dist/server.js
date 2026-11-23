"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const app_js_1 = __importDefault(require("./app.js"));
mongoose_1.default.set('autoIndex', process.env.NODE_ENV !== 'production');
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';
const mongodbUri = process.env.MONGODB_URI;
function required(value, name) {
    if (!value || value.includes('<') || value.startsWith('replace-with-'))
        throw new Error(`${name} must be set to a real value.`);
    return value;
}
async function main() {
    if (!Number.isInteger(port) || port < 1 || port > 65535)
        throw new Error('PORT must be a valid TCP port.');
    const uri = required(mongodbUri, 'MONGODB_URI');
    required(process.env.JWT_SECRET, 'JWT_SECRET');
    await mongoose_1.default.connect(uri, { serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000) });
    const server = app_js_1.default.listen(port, host, () => console.log(`SeniorLearn API listening on ${host}:${port}`));
    const shutdown = async (signal) => {
        console.log(`${signal} received; shutting down.`);
        server.close(async () => { await mongoose_1.default.disconnect(); process.exit(0); });
        setTimeout(() => process.exit(1), 10000).unref();
    };
    process.once('SIGTERM', () => void shutdown('SIGTERM'));
    process.once('SIGINT', () => void shutdown('SIGINT'));
}
main().catch((error) => { console.error('Startup failed:', error instanceof Error ? error.message : error); process.exit(1); });
