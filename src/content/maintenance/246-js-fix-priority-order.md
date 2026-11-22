---
id: maintenance-js-fix-priority-order
language: javascript
title: Fix a priority queue comparator that inverted priority order and lost FIFO tie-breaking
system: Worker pool
symbol: equipment
scene: tests
skills: js-patterns-perf
reviewSkill: js-patterns-perf
prerequisite: priority-task-scheduler
---

## Briefing

`createPriorityQueue()` is supposed to dequeue items with the **highest** numeric `priority` first and break ties in **FIFO** (first-in, first-out) insertion order. Right now its comparator sorts ascending by priority (`a.priority - b.priority`) and reverses FIFO ties (`b.seq - a.seq`)!

## Objective

Fix the `.sort(...)` comparator in `createPriorityQueue()` so `dequeue()` pops the highest `priority` item first, breaking equal-priority ties by smallest `seq` first.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Since `dequeue()` uses `items.shift()`, sort with `(a, b) => b.priority - a.priority || a.seq - b.seq`.

## Starter

```javascript
function createPriorityQueue() {
  const items = [];
  let seq = 0;
  return {
    enqueue(value, priority = 0) {
      items.push({ value, priority, seq: seq++ });
      items.sort((a, b) => a.priority - b.priority || b.seq - a.seq);
    },
    dequeue() {
      return items.shift()?.value;
    },
    size() {
      return items.length;
    },
  };
}
```

## Checks

```javascript
expect("dequeues highest priority first and preserves FIFO order for ties", () => {
  const pq = get("createPriorityQueue")();
  pq.enqueue("low-1", 1);
  pq.enqueue("high-1", 10);
  pq.enqueue("med-1", 5);
  pq.enqueue("high-2", 10);
  pq.enqueue("low-2", 1);

  const out = [];
  while (pq.size() > 0) out.push(pq.dequeue());
  return out;
}, ["high-1", "high-2", "med-1", "low-1", "low-2"]);
```

## Hidden checks

```javascript
expect("returns undefined when dequeuing an empty queue", () => {
  const pq = get("createPriorityQueue")();
  return pq.dequeue();
}, undefined);
```

## Solution

```javascript
function createPriorityQueue() {
  const items = [];
  let seq = 0;
  return {
    enqueue(value, priority = 0) {
      items.push({ value, priority, seq: seq++ });
      items.sort((a, b) => b.priority - a.priority || a.seq - b.seq);
    },
    dequeue() {
      return items.shift()?.value;
    },
    size() {
      return items.length;
    },
  };
}
```

## Restored

The worker pool priority queue now dispatches highest-priority items first with deterministic FIFO tie-breaking.
