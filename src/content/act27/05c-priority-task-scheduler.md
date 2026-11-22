---
id: priority-task-scheduler
kind: code
language: javascript
title: Implement a concurrency-limited async task scheduler with priority and AbortSignal
system: Worker pool
symbol: equipment
scene: tests
skills: js-patterns-perf, js-async
---

## Briefing

When background maintenance jobs and high-priority telemetry alerts compete for worker slots, a simple FIFO queue starves urgent tasks. Build a concurrency-bounded `PriorityScheduler` that dispatches highest-priority tasks first (breaking ties FIFO), honors `AbortSignal` cancellations while queued, and resolves `onIdle()` when all work drains.

## Concept

Implement `class PriorityScheduler`:
- **`constructor(concurrency = 1)`:** stores max concurrent tasks (`concurrency`).
- **`schedule(taskFn, { priority = 0, signal } = {})`:**
  - Returns a `Promise` that resolves or rejects with the outcome of `await taskFn()`.
  - If `signal?.aborted` is already `true` when `schedule` is called, immediately returns a rejected Promise (`new Error("Aborted")`) without queueing or running `taskFn`.
  - If the task is queued waiting for a concurrency slot and `signal` fires an `"abort"` event **before** the task starts running, removes the task from the queue and immediately rejects its Promise with `new Error("Aborted")` without invoking `taskFn`.
  - **Priority ordering:** higher `priority` numbers run before lower `priority` numbers; tasks with equal `priority` run in FIFO submission order.
- **`get activeCount()`:** number of currently running tasks.
- **`get pendingCount()`:** number of tasks currently waiting in the queue.
- **`onIdle()`:** returns a `Promise` that resolves immediately if `activeCount === 0 && pendingCount === 0`, or as soon as both reach `0`.

## Objective

Implement `class PriorityScheduler` with `constructor(concurrency)`, `schedule(taskFn, options)`, `activeCount`, `pendingCount`, and `onIdle()`.

## Hints

1. Assign each queued item a monotonically increasing `seq` counter and sort (or insert) by `b.priority - a.priority || a.seq - b.seq`.
2. When `signal` is provided and not yet aborted, register an `"abort"` listener (`signal.addEventListener("abort", onAbort, { once: true })`) while the item is in the queue, and remove that listener as soon as the task is dequeued to start running!

## Starter: guided

```javascript
class PriorityScheduler {
  constructor(concurrency = 1) {
    this._concurrency = concurrency;
    this._active = 0;
    this._seq = 0;
    this._queue = [];
    this._idleResolvers = [];
  }

  get activeCount() {
    return this._active;
  }

  get pendingCount() {
    return this._queue.length;
  }

  schedule(taskFn, { priority = 0, signal } = {}) {
    // Reject with new Error("Aborted") if signal?.aborted
    // Queue entry with priority & seq, wire abort listener while queued, and pump _drain()
  }

  onIdle() {
    if (this._active === 0 && this._queue.length === 0) return Promise.resolve();
    return new Promise((resolve) => this._idleResolvers.push(resolve));
  }

  _drain() {
    // While _active < _concurrency and _queue not empty, shift highest-priority task and run it
  }
}
```

## Starter: standard

```javascript
class PriorityScheduler {
  constructor(concurrency = 1) {}
  get activeCount() {}
  get pendingCount() {}
  schedule(taskFn, { priority = 0, signal } = {}) {}
  onIdle() {}
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("orders queued tasks by priority with FIFO tie-breaking and respects concurrency limit", async () => {
  const PriorityScheduler = get("PriorityScheduler");
  const sched = new PriorityScheduler(2);
  const started = [];
  let peakActive = 0;

  const makeTask = (id, delayMs = 5) => async () => {
    started.push(id);
    peakActive = Math.max(peakActive, sched.activeCount);
    await new Promise((r) => setTimeout(r, delayMs));
    return id;
  };

  // First two tasks occupy the 2 concurrency slots immediately
  const p1 = sched.schedule(makeTask("slot1"), { priority: 1 });
  const p2 = sched.schedule(makeTask("slot2"), { priority: 1 });

  // While slots are full, queue tasks with varying priorities
  const pLow = sched.schedule(makeTask("low"), { priority: 1 });
  const pHighA = sched.schedule(makeTask("highA"), { priority: 10 });
  const pHighB = sched.schedule(makeTask("highB"), { priority: 10 });
  const pMed = sched.schedule(makeTask("med"), { priority: 5 });

  await sched.onIdle();
  const results = await Promise.all([p1, p2, pLow, pHighA, pHighB, pMed]);

  return {
    started,
    peakActive,
    results,
    finalActive: sched.activeCount,
    finalPending: sched.pendingCount,
  };
}, {
  started: ["slot1", "slot2", "highA", "highB", "med", "low"],
  peakActive: 2,
  results: ["slot1", "slot2", "low", "highA", "highB", "med"],
  finalActive: 0,
  finalPending: 0,
});
```

## Hidden checks

```javascript
await expect("aborts pre-aborted or queued tasks via AbortController without running taskFn", async () => {
  const PriorityScheduler = get("PriorityScheduler");
  const sched = new PriorityScheduler(1);
  let ranAborted = 0;

  let releaseBlocker;
  const blocker = sched.schedule(
    () => new Promise((r) => { releaseBlocker = r; }),
    { priority: 5 }
  );

  const acQueued = new AbortController();
  const queued = sched.schedule(() => {
    ranAborted++;
    return "should-not-run";
  }, { priority: 10, signal: acQueued.signal });

  // Abort while still queued behind blocker
  acQueued.abort();

  const acPre = new AbortController();
  acPre.abort();
  const preAborted = sched.schedule(() => {
    ranAborted++;
  }, { priority: 20, signal: acPre.signal });

  let queuedErr = "";
  let preErr = "";
  try { await queued; } catch (e) { queuedErr = e.message; }
  try { await preAborted; } catch (e) { preErr = e.message; }

  releaseBlocker("done");
  await blocker;
  await sched.onIdle();

  return { ranAborted, queuedErr, preErr, pending: sched.pendingCount };
}, {
  ranAborted: 0,
  queuedErr: "Aborted",
  preErr: "Aborted",
  pending: 0,
});
```

## Solution

```javascript
class PriorityScheduler {
  constructor(concurrency = 1) {
    this._concurrency = Math.max(1, concurrency);
    this._active = 0;
    this._seq = 0;
    this._queue = [];
    this._idleResolvers = [];
  }

  get activeCount() {
    return this._active;
  }

  get pendingCount() {
    return this._queue.length;
  }

  schedule(taskFn, { priority = 0, signal } = {}) {
    if (signal?.aborted) {
      return Promise.reject(new Error("Aborted"));
    }

    return new Promise((resolve, reject) => {
      const entry = {
        taskFn,
        priority,
        seq: this._seq++,
        signal,
        resolve,
        reject,
        onAbort: null,
      };

      if (signal) {
        entry.onAbort = () => {
          const idx = this._queue.indexOf(entry);
          if (idx !== -1) {
            this._queue.splice(idx, 1);
            reject(new Error("Aborted"));
            this._checkIdle();
          }
        };
        signal.addEventListener("abort", entry.onAbort, { once: true });
      }

      this._queue.push(entry);
      this._queue.sort((a, b) => b.priority - a.priority || a.seq - b.seq);
      this._drain();
    });
  }

  onIdle() {
    if (this._active === 0 && this._queue.length === 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => this._idleResolvers.push(resolve));
  }

  _checkIdle() {
    if (this._active === 0 && this._queue.length === 0) {
      while (this._idleResolvers.length > 0) {
        const resolve = this._idleResolvers.shift();
        resolve();
      }
    }
  }

  _drain() {
    while (this._active < this._concurrency && this._queue.length > 0) {
      const entry = this._queue.shift();
      if (entry.signal && entry.onAbort) {
        entry.signal.removeEventListener("abort", entry.onAbort);
      }
      if (entry.signal?.aborted) {
        entry.reject(new Error("Aborted"));
        this._checkIdle();
        continue;
      }

      this._active++;
      Promise.resolve()
        .then(() => entry.taskFn())
        .then(
          (val) => entry.resolve(val),
          (err) => entry.reject(err)
        )
        .finally(() => {
          this._active--;
          this._drain();
          this._checkIdle();
        });
    }
  }
}
```

## Restored

The worker pool scheduler now enforces concurrency limits, dispatches urgent tasks in priority-FIFO order, and cancels queued tasks cleanly via `AbortSignal`.
