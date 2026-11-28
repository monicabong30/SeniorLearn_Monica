import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/index.js';

/**
 * Removes obsolete email-verification fields without changing accounts,
 * passwords, memberships, payments, or any other user data.
 */
async function run() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await User.updateMany({}, {
    $unset: { emailVerifiedAt: 1, emailVerificationHash: 1, emailVerificationExpiresAt: 1 },
  });
  console.log(`Removed email-verification fields from ${result.modifiedCount} user record(s).`);
  await mongoose.disconnect();
}

void run().catch(async error => { console.error(error); await mongoose.disconnect(); process.exitCode = 1; });
