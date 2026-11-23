"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notify = void 0;
exports.activeEnrollmentCount = activeEnrollmentCount;
exports.refreshCapacityStatus = refreshCapacityStatus;
exports.overlaps = overlaps;
const index_js_1 = require("../models/index.js");
const classEntityFromNotification = (body, type) => {
    const knownClassTypes = new Set(['ENROLLMENT', 'CLASS_UPDATED', 'CLASS_CANCELLED', 'FAVOURITE_CLASS_UPDATED']);
    if (!knownClassTypes.has(type))
        return undefined;
    const label = type === 'ENROLLMENT'
        ? body.match(/^You are enrolled in (.+)\.$/)?.[1]
        : body.match(/^(.+?) has (?:changed|been updated|been cancelled)\./)?.[1];
    return label ? { kind: 'CLASS', label } : undefined;
};
// Notification templates are created here, so enriching known class events is backwards compatible
// and avoids making the mobile client infer an entity from arbitrary user-supplied prose.
const notify = (user, title, body, type, session, entity) => index_js_1.Notification.create([{ user, title, body, type, entity: entity || classEntityFromNotification(body, type) }], session ? { session } : undefined).then(rows => rows[0]);
exports.notify = notify;
async function activeEnrollmentCount(classId) { return index_js_1.Enrollment.countDocuments({ class: classId, status: 'ACTIVE' }); }
async function refreshCapacityStatus(classId) { const item = await index_js_1.LearningClass.findById(classId); if (!item || !['SCHEDULED', 'CLOSED'].includes(item.status))
    return item; const count = await activeEnrollmentCount(classId); item.status = count >= item.capacity ? 'CLOSED' : 'SCHEDULED'; return item.save(); }
function overlaps(startA, durationA, startB, durationB) { return startA < new Date(startB.getTime() + durationB * 60000) && startB < new Date(startA.getTime() + durationA * 60000); }
