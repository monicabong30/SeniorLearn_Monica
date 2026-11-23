import 'dotenv/config';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import app from './app.js';

mongoose.set('autoIndex', process.env.NODE_ENV !== 'production');
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';
const mongodbUri = process.env.MONGODB_URI;

function required(value: string | undefined, name: string): string {
  if (!value || value.includes('<') || value.startsWith('replace-with-')) throw new Error(`${name} must be set to a real value.`);
  return value;
}

async function main() {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.');
  const uri = required(mongodbUri, 'MONGODB_URI');
  required(process.env.JWT_SECRET, 'JWT_SECRET');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000) });
  const server = app.listen(port, host, () => console.log(`SeniorLearn API listening on ${host}:${port}`));
  const shutdown = async (signal: string) => {
    console.log(`${signal} received; shutting down.`);
    server.close(async () => { await mongoose.disconnect(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((error: unknown) => { console.error('Startup failed:', error instanceof Error ? error.message : error); process.exit(1); });
