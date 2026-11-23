import 'dotenv/config';
import mongoose from 'mongoose';

const LEGACY_INDEX = 'user_1_class_1';
const ACTIVE_INDEX = 'active_enrollment_per_user_class';
const CLASS_STATUS_INDEX = 'class_1_status_1';
const apply = process.argv.includes('--apply');
const databaseFlag = process.argv[process.argv.indexOf('--database') + 1];
const backupConfirmed = process.argv.includes('--backup-confirmed');

function summary(index: { name?: string; key: unknown; unique?: boolean; partialFilterExpression?: unknown }) {
  return { name: index.name, key: index.key, unique: !!index.unique, partialFilterExpression: index.partialFilterExpression };
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB database connection is unavailable.');
  const collection = db.collection('enrollments');
  const indexes = await collection.indexes();
  const legacy = indexes.find(index => index.name === LEGACY_INDEX);
  const active = indexes.find(index => index.name === ACTIVE_INDEX);
  const duplicateActive = await collection.aggregate([
    { $match: { status: 'ACTIVE' } },
    { $group: { _id: { user: '$user', class: '$class' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();
  const report = { database: db.databaseName, enrollmentCount: await collection.countDocuments(), indexes: indexes.map(summary), duplicateActiveGroups: duplicateActive.length, legacyIndexPresent: !!legacy, activeIndexPresent: !!active };

  if (!apply) {
    console.log(JSON.stringify({ dryRun: true, ...report, plannedOperations: legacy ? [`drop ${LEGACY_INDEX}`, `create ${ACTIVE_INDEX}`, `create ${CLASS_STATUS_INDEX}`] : active ? ['verify existing indexes'] : [`create ${ACTIVE_INDEX}`, `create ${CLASS_STATUS_INDEX}`] }));
    return;
  }
  if (databaseFlag !== db.databaseName) throw new Error(`Refusing migration: pass --database ${db.databaseName} to confirm the target database.`);
  if (!backupConfirmed) throw new Error('Refusing migration: confirm a verified recovery point with --backup-confirmed.');
  if (duplicateActive.length) throw new Error(`Migration stopped: ${duplicateActive.length} duplicate active-enrolment group(s) must be resolved first.`);
  if (legacy) {
    await collection.dropIndex(LEGACY_INDEX);
    try {
      await collection.createIndex({ user: 1, class: 1 }, { name: ACTIVE_INDEX, unique: true, partialFilterExpression: { status: 'ACTIVE' } });
    } catch (error) {
      await collection.createIndex({ user: 1, class: 1 }, { name: LEGACY_INDEX, unique: true }).catch(() => undefined);
      throw error;
    }
  }
  await collection.createIndex({ user: 1, class: 1 }, { name: ACTIVE_INDEX, unique: true, partialFilterExpression: { status: 'ACTIVE' } });
  await collection.createIndex({ class: 1, status: 1 }, { name: CLASS_STATUS_INDEX });
  const resultingIndexes = await collection.indexes();
  const resultingActive = resultingIndexes.find(index => index.name === ACTIVE_INDEX);
  if (!resultingActive?.unique || JSON.stringify(resultingActive.partialFilterExpression) !== JSON.stringify({ status: 'ACTIVE' })) throw new Error('Migration verification failed: active-enrolment partial unique index is not correct.');
  console.log(JSON.stringify({ migrated: true, database: db.databaseName, indexes: resultingIndexes.map(summary) }));
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => mongoose.disconnect());
