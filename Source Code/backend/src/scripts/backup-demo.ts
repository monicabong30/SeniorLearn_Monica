import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";

async function main() {
  if (!process.env.MONGODB_URI) throw Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db!;
  const database = db.databaseName;
  if (process.env.DEMO_SEED_TARGET !== database)
    throw Error("DEMO_SEED_TARGET must exactly match the database being backed up.");
  const collections = await db.listCollections().toArray();
  const snapshot: Record<string, unknown[]> = {};
  for (const collection of collections)
    snapshot[collection.name] = await db.collection(collection.name).find({}).toArray();
  const directory = path.resolve(process.cwd(), "backups");
  await mkdir(directory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(directory, `${database}-${stamp}.json`);
  await writeFile(file, JSON.stringify({ database, createdAt: new Date().toISOString(), collections: snapshot }), "utf8");
  console.log(JSON.stringify({ backup: file, database, collections: Object.fromEntries(Object.entries(snapshot).map(([name, documents]) => [name, documents.length])) }, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => mongoose.disconnect());
