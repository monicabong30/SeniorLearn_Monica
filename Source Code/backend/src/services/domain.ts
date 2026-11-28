import { ClientSession } from 'mongoose';
import { Enrollment, LearningClass, Notification } from '../models/index.js';
import { completeElapsedClasses } from './lifecycle.js';
const classEntityFromNotification = (body: string, type: string) => {
  const knownClassTypes = new Set(['ENROLLMENT', 'CLASS_UPDATED', 'CLASS_CANCELLED', 'FAVOURITE_CLASS_UPDATED']);
  if (!knownClassTypes.has(type)) return undefined;
  const label = type === 'ENROLLMENT'
    ? body.match(/^You are enrolled in (.+)\.$/)?.[1]
    : body.match(/^(.+?) has (?:changed|been updated|been cancelled)\./)?.[1];
  return label ? { kind: 'CLASS', label } : undefined;
};
// Notification templates are created here, so enriching known class events is backwards compatible
// and avoids making the mobile client infer an entity from arbitrary user-supplied prose.
export const notify = (user:string,title:string,body:string,type:string,session?:ClientSession,entity?:{kind:string;id?:string;label:string}) => Notification.create([{user,title,body,type,entity:entity||classEntityFromNotification(body,type)}], session ? { session } : undefined).then(rows => rows[0]);
export async function activeEnrollmentCount(classId:string) { return Enrollment.countDocuments({class:classId,status:'ACTIVE'}); }
export async function refreshCapacityStatus(classId:string) { const item=await LearningClass.findById(classId); if(!item || !['SCHEDULED','CLOSED'].includes(item.status)) return item; const count=await activeEnrollmentCount(classId); item.status=count>=item.capacity?'CLOSED':'SCHEDULED'; return item.save(); }
export function overlaps(startA:Date,durationA:number,startB:Date,durationB:number) { return startA < new Date(startB.getTime()+durationB*60000) && startB < new Date(startA.getTime()+durationA*60000); }
export { completeElapsedClasses };
