import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true });

export function testDatabaseUri() {
  const uri = process.env.MONGODB_TEST_URI;
  if (!uri) throw new Error('MONGODB_TEST_URI is required for integration tests. No fallback to MONGODB_URI is allowed.');
  let database: string;
  try { database = new URL(uri).pathname.replace(/^\//, ''); } catch { throw new Error('MONGODB_TEST_URI is not a valid MongoDB URI.'); }
  if (database !== 'seniorlearn_test') throw new Error(`Refusing integration tests: expected seniorlearn_test, received ${database || '(none)'}.`);
  return uri;
}

export const integrationEnabled = Boolean(process.env.MONGODB_TEST_URI);

/** Atlas can reset an initial TLS socket transiently. Retry connection setup,
 * not individual test operations, while retaining a bounded integration-only
 * failure mode. */
export async function connectIntegrationDatabase(uri = testDatabaseUri()) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000, connectTimeoutMS: 30000 });
    } catch (error) {
      lastError = error;
      await mongoose.disconnect().catch(() => undefined);
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
}
