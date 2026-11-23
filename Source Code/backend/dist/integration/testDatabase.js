"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationEnabled = void 0;
exports.testDatabaseUri = testDatabaseUri;
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: node_path_1.default.resolve(process.cwd(), '.env.test'), override: true });
function testDatabaseUri() {
    const uri = process.env.MONGODB_TEST_URI;
    if (!uri)
        throw new Error('MONGODB_TEST_URI is required for integration tests. No fallback to MONGODB_URI is allowed.');
    let database;
    try {
        database = new URL(uri).pathname.replace(/^\//, '');
    }
    catch {
        throw new Error('MONGODB_TEST_URI is not a valid MongoDB URI.');
    }
    if (database !== 'seniorlearn_test')
        throw new Error(`Refusing integration tests: expected seniorlearn_test, received ${database || '(none)'}.`);
    return uri;
}
exports.integrationEnabled = Boolean(process.env.MONGODB_TEST_URI);
