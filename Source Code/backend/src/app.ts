import 'dotenv/config'; import express from 'express'; import cors from 'cors'; import mongoose from 'mongoose'; import swaggerUi from 'swagger-ui-express'; import api from './routes/api.js'; import { openapi } from './openapi.js'; import { errorHandler } from './utils/http.js';
const app=express();
const origins=(process.env.CLIENT_ORIGIN || '').split(',').map(value=>value.trim()).filter(Boolean);
if(process.env.NODE_ENV==='production' && origins.length===0) throw new Error('CLIENT_ORIGIN is required in production.');
const corsOptions:cors.CorsOptions={origin:(origin,callback)=>{
  if(!origin || origins.includes(origin) || (process.env.NODE_ENV!=='production' && origins.length===0)) return callback(null,true);
  return callback(new Error('Origin is not allowed by CORS'));
},methods:['GET','POST','PUT','DELETE','OPTIONS'],allowedHeaders:['Content-Type','Authorization'],optionsSuccessStatus:204};
const loginAttempts=new Map<string,{count:number;resetAt:number}>();
/** Test-only helper; it is not exposed through an HTTP route. */
export const resetLoginRateLimitForTests=()=>loginAttempts.clear();
const loginRateLimit=(req:express.Request,res:express.Response,next:express.NextFunction)=>{const key=req.ip||'unknown',now=Date.now(),entry=loginAttempts.get(key);if(!entry||entry.resetAt<=now){loginAttempts.set(key,{count:1,resetAt:now+15*60_000});return next();}entry.count++;if(entry.count>10){res.setHeader('Retry-After',Math.ceil((entry.resetAt-now)/1000));return res.status(429).json({error:'Too many sign-in attempts. Please try again later.'});}next();};
app.disable('x-powered-by'); if(process.env.TRUST_PROXY==='true')app.set('trust proxy',1); app.use(cors(corsOptions)); app.options('*',cors(corsOptions)); app.use(express.json({limit:'1mb'}));
app.get('/health',(_req,res)=>res.status(200).json({status:'ok'}));app.get('/ready',(_req,res)=>{const connected=mongoose.connection.readyState===1;res.status(connected?200:503).json({status:connected?'ok':'unavailable'});});app.use('/api/auth/login',loginRateLimit);app.use('/api',api);
app.use('/api-docs',swaggerUi.serve,swaggerUi.setup(openapi,{swaggerOptions:{persistAuthorization:true}}));app.use(errorHandler);export default app;
