"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedQueue = void 0;
exports.availabilityGrid = availabilityGrid;
exports.sortByNextSession = sortByNextSession;
/** Assessment-focused domain utilities used by the scheduling module. */
class LinkedQueue {
    head;
    tail;
    enqueue(value) { const n = { value }; if (this.tail)
        this.tail.next = n;
    else
        this.head = n; this.tail = n; }
    dequeue() { if (!this.head)
        return undefined; const value = this.head.value; this.head = this.head.next; if (!this.head)
        this.tail = undefined; return value; }
    get isEmpty() { return !this.head; }
}
exports.LinkedQueue = LinkedQueue;
/** A two-dimensional availability grid: weekday × 30-minute slot. */
function availabilityGrid(sessions) { const grid = Array.from({ length: 7 }, () => Array(48).fill(false)); for (const s of sessions) {
    const day = s.startsAt.getDay(), start = s.startsAt.getHours() * 2 + Math.floor(s.startsAt.getMinutes() / 30);
    for (let slot = start; slot < Math.min(48, start + Math.ceil(s.durationMinutes / 30)); slot++)
        grid[day][slot] = true;
} return grid; }
function sortByNextSession(items) { return [...items].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()); }
