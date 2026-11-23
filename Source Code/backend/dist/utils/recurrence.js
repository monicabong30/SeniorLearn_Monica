"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOccurrences = generateOccurrences;
function generateOccurrences(startsAt, endDate, frequency, weekdays = []) { if (endDate < startsAt)
    throw new Error('End date must follow start date'); const result = []; for (let d = new Date(startsAt); d <= endDate; d.setDate(d.getDate() + 1)) {
    const days = Math.floor((d.getTime() - startsAt.getTime()) / 86400000);
    const matches = frequency === 'WEEKLY' ? d.getDay() === startsAt.getDay() : frequency === 'BIWEEKLY' ? d.getDay() === startsAt.getDay() && days % 14 === 0 : weekdays.includes(d.getDay());
    if (matches)
        result.push(new Date(d));
} if (!result.length || result.length > 52)
    throw new Error('Choose between 1 and 52 occurrences'); return result; }
