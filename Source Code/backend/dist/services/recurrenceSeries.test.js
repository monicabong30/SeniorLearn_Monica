"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const recurrenceSeries_js_1 = require("./recurrenceSeries.js");
const rows = [0, 1, 2].map(i => ({ _id: `c${i}`, recurrenceSeriesId: 's', occurrenceIndex: i, status: 'SCHEDULED', startsAt: new Date(2027, 0, i + 1) }));
(0, vitest_1.describe)('recurrence scopes', () => { (0, vitest_1.it)('selects one occurrence', () => (0, vitest_1.expect)((0, recurrenceSeries_js_1.affectedOccurrences)(rows, 's', 'c1', 'SINGLE').map(x => x._id)).toEqual(['c1'])); (0, vitest_1.it)('selects future occurrences only', () => (0, vitest_1.expect)((0, recurrenceSeries_js_1.affectedOccurrences)(rows, 's', 'c1', 'FUTURE').map(x => x._id)).toEqual(['c1', 'c2'])); (0, vitest_1.it)('cancels all without deleting records', () => (0, vitest_1.expect)((0, recurrenceSeries_js_1.cancelOccurrences)(structuredClone(rows), 's', 'c1', 'ALL').map(x => x.status)).toEqual(['CANCELLED', 'CANCELLED', 'CANCELLED'])); });
