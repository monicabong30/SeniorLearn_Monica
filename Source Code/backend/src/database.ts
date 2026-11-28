import mongoose from 'mongoose';

const development = process.env.NODE_ENV !== 'production';
const numberSetting = (name: string, fallback: number) => {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};
const options = {
  // One process-wide pool is shared by every Mongoose model and request.
  maxPoolSize: numberSetting('MONGODB_MAX_POOL_SIZE', 10), minPoolSize: numberSetting('MONGODB_MIN_POOL_SIZE', 1),
  maxIdleTimeMS: numberSetting('MONGODB_MAX_IDLE_TIME_MS', 60_000), waitQueueTimeoutMS: numberSetting('MONGODB_WAIT_QUEUE_TIMEOUT_MS', 5_000),
  serverSelectionTimeoutMS: numberSetting('MONGODB_SERVER_SELECTION_TIMEOUT_MS', 8_000), connectTimeoutMS: numberSetting('MONGODB_CONNECT_TIMEOUT_MS', 10_000), socketTimeoutMS: numberSetting('MONGODB_SOCKET_TIMEOUT_MS', 30_000),
};
let uri: string | undefined; let connecting: Promise<typeof mongoose> | undefined; let retryTimer: NodeJS.Timeout | undefined; let retryAttempt = 0; let listenersAttached = false;
function scheduleReconnect() { if (!uri || retryTimer || mongoose.connection.readyState === 1 || connecting) return; const delay=Math.min(30_000,1_000*2**Math.min(retryAttempt++,5)); if(development)console.warn(`[MongoDB] unavailable; retrying the shared connection in ${delay}ms`); retryTimer=setTimeout(()=>{retryTimer=undefined;void connectShared();},delay);retryTimer.unref(); }
function attachListeners() { if(listenersAttached)return;listenersAttached=true;mongoose.connection.on('connected',()=>{retryAttempt=0;if(development)console.info('[MongoDB] connected');});mongoose.connection.on('disconnected',()=>{if(development)console.warn('[MongoDB] disconnected');scheduleReconnect();});mongoose.connection.on('error',error=>{if(development)console.warn('[MongoDB] connection error:',error instanceof Error?error.message:error);scheduleReconnect();}); }
export const databaseReady=()=>mongoose.connection.readyState===1;
export const databaseStatus=()=>({status:databaseReady()?'ok':'unavailable',state:mongoose.connection.readyState});
export async function connectShared() { if(databaseReady())return mongoose;if(!uri)throw Error('MONGODB_URI is not configured.');if(connecting)return connecting;attachListeners();connecting=mongoose.connect(uri,options).finally(()=>{connecting=undefined;if(!databaseReady())scheduleReconnect();});return connecting; }
/** Starts the one shared Mongoose connection and keeps retrying after transient Atlas failures. */
export function startDatabase(uriValue:string) { uri=uriValue;attachListeners();return connectShared(); }
export async function stopDatabase() { if(retryTimer)clearTimeout(retryTimer);retryTimer=undefined;await mongoose.disconnect(); }
