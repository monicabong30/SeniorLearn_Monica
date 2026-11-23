"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const classChanges_js_1 = require("./classChanges.js");
(0, vitest_1.describe)('class change tracking', () => { (0, vitest_1.it)('records meaningful old and new values only', () => (0, vitest_1.expect)((0, classChanges_js_1.meaningfulClassChanges)({ title: 'A', status: 'SCHEDULED' }, { title: 'B', status: 'SCHEDULED' })).toEqual([{ field: 'title', previous: 'A', current: 'B' }])); (0, vitest_1.it)('does not record a no-op', () => (0, vitest_1.expect)((0, classChanges_js_1.meaningfulClassChanges)({ capacity: 12 }, { capacity: 12 })).toEqual([])); });
