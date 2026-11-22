---
id: async-stream-pipeline
kind: code
language: javascript
title: Build an async iterable channel and async generator transform pipeline
system: Event bench
symbol: equipment
scene: tests
skills: js-streams-buffers, js-async
---

## Briefing

When producers push telemetry events at irregular intervals while consumers process them asynchronously, an `AsyncChannel` bridges push events into a standard `for await (const item of channel)` stream that composes cleanly with `async function*` transform stages.

## Concept

1. **`class AsyncChannel`:**
   - Maintains an internal queue of buffered values (`_queue`), a queue of waiting consumer resolvers (`_waiters`), and a `_closed` flag.
   - **`send(value)`:**
     - If already closed, throws `new Error("Channel is closed")`.
     - If a consumer is currently waiting in `_waiters`, shifts that resolver and calls `resolve({ value, done: false })`.
     - Otherwise pushes `value` into `_queue`.
   - **`close()`:**
     - Sets `_closed = true` and resolves every waiting consumer in `_waiters` with `{ value: undefined, done: true }`.
   - **`async *[Symbol.asyncIterator]()`:**
     - Yields buffered values from `_queue` while available.
     - When `_queue` is empty: if `_closed` is `true`, terminates; otherwise awaits a Promise pushed onto `_waiters` and yields its value if `done` is `false`.
2. **`async function runPipeline(sourceIterable, transforms = [])`:**
   - Pipes `sourceIterable` through each `async function*(iterable)` transform in `transforms` in order (`stream = stage(stream)`).
   - Consumes the final async (or sync) iterable with `for await (const item of stream)` and returns the collected array of items.

## Objective

Implement `class AsyncChannel` (`send`, `close`, `[Symbol.asyncIterator]`) and `async function runPipeline(sourceIterable, transforms)`.

## Hints

1. Inside `async *[Symbol.asyncIterator]()`, loop `while (true)`: if `this._queue.length > 0`, `yield this._queue.shift()`; else if `this._closed`, `return`; else await `new Promise((resolve) => this._waiters.push(resolve))` and check `if (next.done) return; yield next.value;`.
2. `for await (const x of stream)` automatically works on both synchronous iterables (like arrays) and asynchronous iterables (like `AsyncChannel` or `async function*` generators).

## Starter: guided

```javascript
class AsyncChannel {
  constructor() {
    this._queue = [];
    this._waiters = [];
    this._closed = false;
  }

  send(value) {
    if (this._closed) throw new Error("Channel is closed");
    // Deliver to waiting consumer if any, otherwise push to this._queue
  }

  close() {
    this._closed = true;
    // Resolve all waiting consumers with { value: undefined, done: true }
  }

  async *[Symbol.asyncIterator]() {
    // Drain buffered items and await future sends until closed and empty
  }
}

async function runPipeline(sourceIterable, transforms = []) {
  // Pipe sourceIterable through each transform stage and collect results into an array
}
```

## Starter: standard

```javascript
class AsyncChannel {
  send(value) {}
  close() {}
  async *[Symbol.asyncIterator]() {}
}

async function runPipeline(sourceIterable, transforms = []) {}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("streams buffered and delayed AsyncChannel items through async generator transforms", async () => {
  const AsyncChannel = get("AsyncChannel");
  const runPipeline = get("runPipeline");
  const ch = new AsyncChannel();

  ch.send(1);
  ch.send(2);

  Promise.resolve().then(() => {
    ch.send(3);
    ch.send(4);
    ch.close();
  });

  const doubleOdd = async function* (src) {
    for await (const n of src) {
      if (n % 2 === 1) yield n * 2;
    }
  };
  const tag = async function* (src) {
    for await (const n of src) {
      yield `#${n}`;
    }
  };

  return await runPipeline(ch, [doubleOdd, tag]);
}, ["#2", "#6"]);
```

## Hidden checks

```javascript
await expect("rejects send() after close() and supports empty transform lists", async () => {
  const AsyncChannel = get("AsyncChannel");
  const runPipeline = get("runPipeline");
  const ch = new AsyncChannel();
  ch.send("a");
  ch.close();
  expectThrows("send after close", () => ch.send("b"));
  const out = await runPipeline(ch, []);
  return out;
}, ["a"]);
```

## Solution

```javascript
class AsyncChannel {
  constructor() {
    this._queue = [];
    this._waiters = [];
    this._closed = false;
  }

  send(value) {
    if (this._closed) {
      throw new Error("Channel is closed");
    }
    if (this._waiters.length > 0) {
      const resolve = this._waiters.shift();
      resolve({ value, done: false });
    } else {
      this._queue.push(value);
    }
  }

  close() {
    this._closed = true;
    while (this._waiters.length > 0) {
      const resolve = this._waiters.shift();
      resolve({ value: undefined, done: true });
    }
  }

  async *[Symbol.asyncIterator]() {
    while (true) {
      if (this._queue.length > 0) {
        yield this._queue.shift();
        continue;
      }
      if (this._closed) return;
      const next = await new Promise((resolve) => this._waiters.push(resolve));
      if (next.done) return;
      yield next.value;
    }
  }
}

async function runPipeline(sourceIterable, transforms = []) {
  let stream = sourceIterable;
  for (const stage of transforms) {
    stream = stage(stream);
  }
  const results = [];
  for await (const item of stream) {
    results.push(item);
  }
  return results;
}
```

## Restored

The event bench now bridges push producers and pull consumers through `AsyncChannel` and composable `async function*` pipelines.
