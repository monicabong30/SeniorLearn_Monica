import path from 'node:path';
import dotenv from 'dotenv';

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
