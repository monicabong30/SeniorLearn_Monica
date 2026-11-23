"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meaningfulClassChanges = void 0;
const meaningfulClassChanges = (before, after) => ['title', 'description', 'startsAt', 'durationMinutes', 'address', 'delivery', 'status', 'capacity', 'tutor'].flatMap(field => JSON.stringify(before[field]) === JSON.stringify(after[field]) ? [] : [{ field, previous: before[field], current: after[field] }]);
exports.meaningfulClassChanges = meaningfulClassChanges;
