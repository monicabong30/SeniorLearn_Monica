"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.affectedOccurrences = affectedOccurrences;
exports.cancelOccurrences = cancelOccurrences;
function affectedOccurrences(items, seriesId, fromId, scope) { const current = items.find(x => String(x._id) === fromId && x.recurrenceSeriesId === seriesId); if (!current)
    throw new Error('Occurrence not found'); return items.filter(x => x.recurrenceSeriesId === seriesId && (scope === 'ALL' || (scope === 'SINGLE' ? String(x._id) === String(current._id) : x.occurrenceIndex >= current.occurrenceIndex))); }
function cancelOccurrences(items, seriesId, fromId, scope) { for (const item of affectedOccurrences(items, seriesId, fromId, scope))
    item.status = 'CANCELLED'; return items; }
