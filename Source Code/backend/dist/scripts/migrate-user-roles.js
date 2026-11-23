"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const index_js_1 = require("../models/index.js");
/** Backfills only missing/legacy role data. Defaults to dry-run; pass --execute to write. */
const execute = process.argv.includes('--execute');
async function main() {
    if (!process.env.MONGODB_URI)
        throw new Error('MONGODB_URI is required.');
    if (execute && process.env.CONFIRM_USER_ROLE_MIGRATION !== 'yes')
        throw new Error('Refusing write: set CONFIRM_USER_ROLE_MIGRATION=yes after a verified backup.');
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    let scanned = 0, changed = 0;
    for await (const user of index_js_1.User.find().cursor()) {
        scanned++;
        const roles = (0, index_js_1.normalizeRoles)(user.roles, user.role);
        const admin = (0, index_js_1.isAdmin)(user);
        if (JSON.stringify(user.roles || []) === JSON.stringify(roles) && user.isAdmin === admin)
            continue;
        changed++;
        if (execute)
            await index_js_1.User.updateOne({ _id: user._id }, { $set: { roles, isAdmin: admin } });
    }
    console.log(`${execute ? 'Applied' : 'Dry run'}: scanned ${scanned}, ${changed} user records would change.`);
    await mongoose_1.default.disconnect();
}
main().catch(async (error) => { console.error(error); await mongoose_1.default.disconnect(); process.exitCode = 1; });
