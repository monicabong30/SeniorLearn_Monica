import 'dotenv/config';
import mongoose from 'mongoose';
import { User, isAdmin, normalizeRoles } from '../models/index.js';

/** Backfills only missing/legacy role data. Defaults to dry-run; pass --execute to write. */
const execute = process.argv.includes('--execute');
async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  if (execute && process.env.CONFIRM_USER_ROLE_MIGRATION !== 'yes') throw new Error('Refusing write: set CONFIRM_USER_ROLE_MIGRATION=yes after a verified backup.');
  await mongoose.connect(process.env.MONGODB_URI);
  let scanned=0, changed=0;
  for await (const user of User.find().cursor()) {
    scanned++;
    const roles=normalizeRoles((user as any).roles, (user as any).role);
    const admin=isAdmin(user);
    if (JSON.stringify((user as any).roles||[])===JSON.stringify(roles) && (user as any).isAdmin===admin) continue;
    changed++;
    if(execute) await User.updateOne({_id:user._id}, {$set:{roles,isAdmin:admin}});
  }
  console.log(`${execute?'Applied':'Dry run'}: scanned ${scanned}, ${changed} user records would change.`);
  await mongoose.disconnect();
}
main().catch(async error=>{console.error(error);await mongoose.disconnect();process.exitCode=1});
