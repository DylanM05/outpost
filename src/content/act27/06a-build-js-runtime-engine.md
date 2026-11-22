---
id: build-js-runtime-engine
kind: code
language: javascript
title: Build an end-to-end JavaScript runtime engine with streams, plugins, proxy config, and scheduler
system: Runtime audit
symbol: controller
scene: tests
assessment: true
skills: js-streams-buffers, js-testing-tooling, js-patterns-perf
---

## Briefing

Tie **JS III (*The runtime deck*)** together in `class OutpostRuntime`: a unified engine combining a schema-guarded configuration `Proxy`, a snapshot-safe `EventEmitter` bus, a topological plugin boot loader with cycle detection, a streaming binary packet codec, and a priority task scheduler!

## Concept

Implement `class OutpostRuntime`:
- **`constructor({ config = {}, validators = {}, concurrency = 2 } = {})`:**
  - Creates `this.config` as a `Proxy` over `{ ...config }` that validates property writes against `validators[prop]` (throwing `TypeError` if missing validator or predicate returns `false`) and records `{ prop, oldValue, newValue }` in an internal history list returned by **`getConfigHistory()`**.
  - Initializes an internal event bus, plugin registry, streaming binary decoder, and priority job queue (`concurrency`).
- **Event bus (`on(event, fn)`, `once(event, fn)`, `off(event, fn)`, `emit(event, ...args)`):**
  - Snapshot-safe listener dispatch (`on` and `once` return unsubscribe callbacks; `emit` returns `true` if any listener ran, `false` otherwise).
- **Topological plugin loader (`registerPlugin(name, deps, initFn)` & `async boot()`):**
  - `registerPlugin(name, deps = [], initFn = () => {})` registers a plugin and its dependency names (returning `this`).
  - `async boot()` topologically sorts all registered plugins (dependencies before dependents, visiting dependencies in listed order). If any cycle exists, throws `new Error("Plugin cycle detected")`. Otherwise awaits `initFn(this)` for each plugin in topological order, emits `"booted"` with the boot order array, and returns the boot order array.
- **Binary packet stream (`encodePacket({ type, flags = 0, seq, payload })` & `ingestChunk(chunkUint8Array)`):**
  - Uses the 8-byte big-endian frame format (`0x4F50` magic, 1B `type`, 1B `flags`, 2B `seq`, 2B UTF-8 `payloadLen` + UTF-8 payload).
  - `ingestChunk(chunk)` buffers incoming `Uint8Array` chunks, decodes every complete frame `{ type, flags, seq, payload }`, emits `"packet"` with each decoded frame on the runtime event bus, and returns the array of frames decoded during that call.
- **Priority job scheduler (`scheduleJob(taskFn, { priority = 0 } = {})` & `onIdle()`):**
  - Runs async tasks up to `concurrency` in parallel, ordering queued tasks by highest `priority` first (FIFO tie-break), and resolves `onIdle()` when all active and queued tasks complete.

## Objective

Implement `class OutpostRuntime` integrating guarded config, event bus, topological plugin boot, binary frame streaming, and priority job scheduling.

## Hints

1. Reuse the 8-byte header layout (`0x4F50`, `type`, `flags`, `seq`, `payloadLen`) from `binary-frame-codec` so `encodePacket` and `ingestChunk` round-trip split or concatenated chunks seamlessly.
2. In `boot()`, run a 3-state DFS across all registered plugin names (`Object.keys` / `Map.keys` in registration order) to detect cycles before awaiting each plugin's `initFn(this)`.

## Starter: guided

```javascript
class OutpostRuntime {
  constructor({ config = {}, validators = {}, concurrency = 2 } = {}) {
    this._configHistory = [];
    this.config = new Proxy({ ...config }, {
      set: (target, prop, value) => {
        const fn = validators[prop];
        if (typeof fn !== "function" || fn(value) !== true) {
          throw new TypeError(`Invalid config "${String(prop)}"`);
        }
        const oldValue = target[prop];
        target[prop] = value;
        this._configHistory.push({ prop: String(prop), oldValue, newValue: value });
        return true;
      },
    });
    // Initialize event listeners Map, plugins Map, byte buffer, and priority scheduler state
  }

  getConfigHistory() {
    return [...this._configHistory];
  }

  on(event, fn) {}
  once(event, fn) {}
  off(event, fn) {}
  emit(event, ...args) {}

  registerPlugin(name, deps = [], initFn = () => {}) {
    return this;
  }

  async boot() {}

  encodePacket({ type, flags = 0, seq, payload }) {}
  ingestChunk(chunk) {}

  scheduleJob(taskFn, { priority = 0 } = {}) {}
  onIdle() {}
}
```

## Starter: standard

```javascript
class OutpostRuntime {
  constructor(options) {}
  getConfigHistory() {}
  on(event, fn) {}
  once(event, fn) {}
  off(event, fn) {}
  emit(event, ...args) {}
  registerPlugin(name, deps, initFn) {}
  async boot() {}
  encodePacket(packet) {}
  ingestChunk(chunk) {}
  scheduleJob(taskFn, options) {}
  onIdle() {}
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("boots plugins topologically, validates config via Proxy, decodes streamed binary packets, and schedules priority jobs", async () => {
  const OutpostRuntime = get("OutpostRuntime");
  const rt = new OutpostRuntime({
    config: { maxRate: 10 },
    validators: { maxRate: (v) => Number.isInteger(v) && v > 0 },
    concurrency: 1,
  });

  // 1. Config Proxy validation + history
  rt.config.maxRate = 25;
  expectThrows("rejects invalid config write", () => {
    rt.config.maxRate = -5;
  }, "TypeError");

  // 2. Topological plugin boot
  const initTrace = [];
  rt.registerPlugin("telemetry", ["transport", "codec"], async (engine) => {
    initTrace.push(`telemetry:${engine.config.maxRate}`);
  });
  rt.registerPlugin("codec", [], () => {
    initTrace.push("codec");
  });
  rt.registerPlugin("transport", ["codec"], () => {
    initTrace.push("transport");
  });

  let bootedEvent = null;
  rt.once("booted", (order) => {
    bootedEvent = order;
  });
  const bootOrder = await rt.boot();

  // 3. Binary packet streaming + priority job scheduling
  const jobOrder = [];
  rt.on("packet", (pkt) => {
    rt.scheduleJob(async () => {
      jobOrder.push(`${pkt.seq}:${pkt.payload}`);
    }, { priority: pkt.type });
  });

  const pLow = rt.encodePacket({ type: 1, flags: 0, seq: 101, payload: "low" });
  const pUrgent = rt.encodePacket({ type: 9, flags: 1, seq: 102, payload: "urgent" });
  const combined = new Uint8Array(pLow.length + pUrgent.length);
  combined.set(pLow, 0);
  combined.set(pUrgent, pLow.length);

  // Hold the single concurrency slot so both packet jobs queue up and sort by priority
  let releaseHold;
  const holdGate = new Promise((r) => { releaseHold = r; });
  rt.scheduleJob(() => holdGate, { priority: 100 });

  const part1 = rt.ingestChunk(combined.subarray(0, 6));
  const part2 = rt.ingestChunk(combined.subarray(6));

  releaseHold();
  await rt.onIdle();

  return {
    configHistory: rt.getConfigHistory(),
    bootOrder,
    bootedEvent,
    initTrace,
    part1Count: part1.length,
    part2Payloads: part2.map((p) => p.payload),
    jobOrder,
  };
}, {
  configHistory: [{ prop: "maxRate", oldValue: 10, newValue: 25 }],
  bootOrder: ["codec", "transport", "telemetry"],
  bootedEvent: ["codec", "transport", "telemetry"],
  initTrace: ["codec", "transport", "telemetry:25"],
  part1Count: 0,
  part2Payloads: ["low", "urgent"],
  jobOrder: ["102:urgent", "101:low"],
});
```

## Hidden checks

```javascript
await expect("boot() rejects when plugins contain a circular dependency", async () => {
  const OutpostRuntime = get("OutpostRuntime");
  const rt = new OutpostRuntime();
  rt.registerPlugin("a", ["b"]);
  rt.registerPlugin("b", ["a"]);
  let threw = false;
  try {
    await rt.boot();
  } catch {
    threw = true;
  }
  return threw;
}, true);
```

## Solution

```javascript
const _MAGIC = 0x4F50;
const _enc = new TextEncoder();
const _dec = new TextDecoder();

class OutpostRuntime {
  constructor({ config = {}, validators = {}, concurrency = 2 } = {}) {
    this._configHistory = [];
    this.config = new Proxy({ ...config }, {
      set: (target, prop, value) => {
        const fn = validators[prop];
        if (typeof fn !== "function" || fn(value) !== true) {
          throw new TypeError(`Invalid config value for "${String(prop)}"`);
        }
        const oldValue = target[prop];
        target[prop] = value;
        this._configHistory.push({ prop: String(prop), oldValue, newValue: value });
        return true;
      },
    });

    this._events = new Map();
    this._plugins = new Map();
    this._buf = new Uint8Array(0);

    this._concurrency = Math.max(1, concurrency);
    this._active = 0;
    this._seq = 0;
    this._queue = [];
    this._idleResolvers = [];
  }

  getConfigHistory() {
    return [...this._configHistory];
  }

  on(event, fn) {
    const list = this._events.get(event) ?? [];
    list.push(fn);
    this._events.set(event, list);
    return () => this.off(event, fn);
  }

  once(event, fn) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      fn(...args);
    };
    wrapper.fn = fn;
    return this.on(event, wrapper);
  }

  off(event, fn) {
    const list = this._events.get(event);
    if (!list) return this;
    const idx = list.findIndex((l) => l === fn || l.fn === fn);
    if (idx !== -1) list.splice(idx, 1);
    if (list.length === 0) this._events.delete(event);
    return this;
  }

  emit(event, ...args) {
    const list = this._events.get(event);
    if (!list || list.length === 0) return false;
    for (const fn of [...list]) {
      fn(...args);
    }
    return true;
  }

  registerPlugin(name, deps = [], initFn = () => {}) {
    this._plugins.set(name, { name, deps, initFn });
    return this;
  }

  async boot() {
    const state = new Map();
    const order = [];

    const dfs = (name) => {
      state.set(name, 1);
      const plugin = this._plugins.get(name);
      for (const dep of plugin?.deps ?? []) {
        const s = state.get(dep) ?? 0;
        if (s === 1) throw new Error(`Plugin cycle detected involving "${dep}"`);
        if (s === 0) dfs(dep);
      }
      state.set(name, 2);
      order.push(name);
    };

    for (const name of this._plugins.keys()) {
      if ((state.get(name) ?? 0) === 0) {
        dfs(name);
      }
    }

    for (const name of order) {
      const plugin = this._plugins.get(name);
      if (plugin?.initFn) {
        await plugin.initFn(this);
      }
    }

    this.emit("booted", order);
    return order;
  }

  encodePacket({ type, flags = 0, seq, payload }) {
    const body = _enc.encode(String(payload ?? ""));
    const out = new Uint8Array(8 + body.byteLength);
    const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    view.setUint16(0, _MAGIC, false);
    view.setUint8(2, type & 0xff);
    view.setUint8(3, flags & 0xff);
    view.setUint16(4, seq & 0xffff, false);
    view.setUint16(6, body.byteLength, false);
    out.set(body, 8);
    return out;
  }

  ingestChunk(chunk) {
    if (chunk && chunk.byteLength > 0) {
      const merged = new Uint8Array(this._buf.byteLength + chunk.byteLength);
      merged.set(this._buf, 0);
      merged.set(chunk, this._buf.byteLength);
      this._buf = merged;
    }

    const packets = [];
    while (this._buf.byteLength >= 2) {
      const view = new DataView(this._buf.buffer, this._buf.byteOffset, this._buf.byteLength);
      if (view.getUint16(0, false) !== _MAGIC) {
        throw new Error("Invalid packet magic");
      }
      if (this._buf.byteLength < 8) break;
      const type = view.getUint8(2);
      const flags = view.getUint8(3);
      const seq = view.getUint16(4, false);
      const payloadLen = view.getUint16(6, false);
      const total = 8 + payloadLen;
      if (this._buf.byteLength < total) break;
      const payload = _dec.decode(this._buf.subarray(8, total));
      const pkt = { type, flags, seq, payload };
      packets.push(pkt);
      this._buf = this._buf.slice(total);
      this.emit("packet", pkt);
    }
    return packets;
  }

  scheduleJob(taskFn, { priority = 0 } = {}) {
    return new Promise((resolve, reject) => {
      this._queue.push({
        taskFn,
        priority,
        seq: this._seq++,
        resolve,
        reject,
      });
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

  _drain() {
    while (this._active < this._concurrency && this._queue.length > 0) {
      const job = this._queue.shift();
      this._active++;
      Promise.resolve()
        .then(() => job.taskFn())
        .then(
          (v) => job.resolve(v),
          (e) => job.reject(e)
        )
        .finally(() => {
          this._active--;
          this._drain();
          if (this._active === 0 && this._queue.length === 0) {
            while (this._idleResolvers.length > 0) {
              this._idleResolvers.shift()();
            }
          }
        });
    }
  }
}
```

## Restored

The runtime deck is fully operational — `OutpostRuntime` unifies binary stream framing, event emission, topological plugin loading, `Proxy` schema guards, and priority task scheduling.
