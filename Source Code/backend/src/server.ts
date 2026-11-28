import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { createServer } from 'node:https';
import mongoose from 'mongoose';
import app from './app.js';
import { startDatabase, stopDatabase } from './database.js';

mongoose.set('autoIndex', process.env.NODE_ENV !== 'production');
mongoose.set('bufferCommands', false);
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';
const mongodbUri = process.env.MONGODB_URI;
// npm workspace scripts run with backend/ as the current directory in both dev
// and compiled start modes, so certificate paths have one stable base.
const backendRoot = resolve(process.cwd());

function required(value: string | undefined, name: string): string {
  if (!value || value.includes('<') || value.startsWith('replace-with-')) throw new Error(`${name} must be set to a real value.`);
  return value;
}

function certificatePath(value: string | undefined, name: string): string {
  const supplied = required(value, name);
  return isAbsolute(supplied) ? supplied : resolve(backendRoot, supplied);
}

function tlsOptions() {
  if (process.env.HTTPS_ENABLED?.toLowerCase() === 'false') {
    throw new Error('HTTPS_ENABLED=false is not supported by the SeniorLearn assessment server. Set HTTPS_ENABLED=true.');
  }
  const keyPath = certificatePath(process.env.HTTPS_KEY_PATH, 'HTTPS_KEY_PATH');
  const certPath = certificatePath(process.env.HTTPS_CERT_PATH, 'HTTPS_CERT_PATH');
  try {
    return { key: readFileSync(keyPath), cert: readFileSync(certPath), minVersion: 'TLSv1.2' as const };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read HTTPS certificate files (key: ${keyPath}; certificate: ${certPath}): ${detail}`);
  }
}

async function main() {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.');
  const uri = required(mongodbUri, 'MONGODB_URI');
  required(process.env.JWT_SECRET, 'JWT_SECRET');
  const server = createServer(tlsOptions(), app);
  server.listen(port, host, () => console.log(`SeniorLearn HTTPS API listening on https://${host}:${port}`));
  // Keep health/readiness available while Atlas recovers; API routes are gated.
  void startDatabase(uri).catch(error => console.error('MongoDB initial connection failed:', error instanceof Error ? error.message : error));
  const shutdown = async (signal: string) => {
    console.log(`${signal} received; shutting down.`);
    server.close(async () => { await stopDatabase(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((error: unknown) => { console.error('Startup failed:', error instanceof Error ? error.message : error); process.exit(1); });
