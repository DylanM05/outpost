---
id: binary-frame-codec
kind: code
language: javascript
title: Encode and stream-decode binary protocol frames with Uint8Array and DataView
system: Stream dock
symbol: instrument
scene: tests
skills: js-streams-buffers
---

## Briefing

Outpost telemetry packets arrive over a raw TCP stream where a single `Uint8Array` chunk may contain half a packet, or three packets concatenated back-to-back. Build the binary frame encoder, single-frame decoder, and streaming frame reassembler.

## Concept

Each binary frame consists of an **8-byte big-endian header** followed by `payloadLen` UTF-8 bytes:

| Offset | Size | Field | Description |
| --- | --- | --- | --- |
| `0..1` | 2B | `magic` | Unsigned 16-bit big-endian magic constant `0x4F50` (`"OP"`) |
| `2` | 1B | `type` | Unsigned 8-bit message type (`0..255`) |
| `3` | 1B | `flags` | Unsigned 8-bit bitflags (`0..255`) |
| `4..5` | 2B | `seq` | Unsigned 16-bit big-endian sequence number (`0..65535`) |
| `6..7` | 2B | `payloadLen` | Unsigned 16-bit big-endian byte length of UTF-8 `payload` |
| `8..` | `payloadLen` | `payload` | UTF-8 encoded string bytes |

- **`encodeFrame({ type, flags, seq, payload })`:** encodes `payload` with `TextEncoder`, allocates `new Uint8Array(8 + payloadBytes.length)`, writes the 8-byte header with `DataView`, copies `payloadBytes` at offset `8`, and returns the `Uint8Array`.
- **`decodeFrame(bytes)`:** validates that `bytes` is at least 8 bytes long, starts with magic `0x4F50`, and has `bytes.byteLength === 8 + payloadLen` (throwing `new Error(...)` on any violation). Returns `{ type, flags, seq, payload }`.
  - Always create the `DataView` with `new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)` so `.subarray(...)` views work safely!
- **`class FrameStreamDecoder`:**
  - `push(chunk)`: appends `chunk` (`Uint8Array`) to an internal unread byte buffer.
  - While at least 8 unread bytes are available, checks the magic header (throwing `new Error("Invalid magic")` if `magic !== 0x4F50`). If `unread.byteLength < 8 + payloadLen`, stops and waits for more chunks; otherwise decodes the frame, advances past `8 + payloadLen` bytes, and collects the decoded frame.
  - Returns the array of complete frames decoded during that `push(chunk)` call.

## Objective

Implement `encodeFrame(frame)`, `decodeFrame(bytes)`, and `class FrameStreamDecoder` with `push(chunk)`.

## Hints

1. To concatenate two `Uint8Array` buffers `a` and `b`, allocate `const merged = new Uint8Array(a.length + b.length)`, then call `merged.set(a, 0)` and `merged.set(b, a.length)`.
2. Remember that multi-byte UTF-8 characters (like `"⚡"`) have more UTF-8 bytes than `.length` code units — always use the `Uint8Array` returned by `new TextEncoder().encode(payload)` for `payloadLen`!

## Starter: guided

```javascript
const MAGIC = 0x4F50;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function encodeFrame({ type, flags, seq, payload }) {
  const body = encoder.encode(payload);
  const out = new Uint8Array(8 + body.byteLength);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  // Write 8-byte header (magic, type, flags, seq, body.byteLength) and copy body at offset 8
  return out;
}

function decodeFrame(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 8) {
    throw new Error("Frame too short");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // Validate magic (0x4F50) and exact 8 + payloadLen length, then return { type, flags, seq, payload }
}

class FrameStreamDecoder {
  constructor() {
    this._buf = new Uint8Array(0);
  }

  push(chunk) {
    // Append chunk to this._buf and extract all complete frames
    return [];
  }
}
```

## Starter: standard

```javascript
function encodeFrame({ type, flags, seq, payload }) {}

function decodeFrame(bytes) {}

class FrameStreamDecoder {
  push(chunk) {}
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("encodes and decodes a single binary frame with multi-byte UTF-8 payload", () => {
  const encodeFrame = get("encodeFrame");
  const decodeFrame = get("decodeFrame");
  const frame = { type: 7, flags: 3, seq: 1024, payload: "dock-⚡-ok" };
  const raw = encodeFrame(frame);
  return {
    isUint8: raw instanceof Uint8Array,
    byteLen: raw.byteLength,
    magicHex: (raw[0] << 8) | raw[1],
    decoded: decodeFrame(raw),
  };
}, {
  isUint8: true,
  byteLen: 8 + 11,
  magicHex: 0x4F50,
  decoded: { type: 7, flags: 3, seq: 1024, payload: "dock-⚡-ok" },
});

expect("FrameStreamDecoder reassembles split chunks and separates concatenated frames", () => {
  const encodeFrame = get("encodeFrame");
  const FrameStreamDecoder = get("FrameStreamDecoder");
  const f1 = encodeFrame({ type: 1, flags: 0, seq: 10, payload: "alpha" });
  const f2 = encodeFrame({ type: 2, flags: 1, seq: 11, payload: "bravo" });
  const combined = new Uint8Array(f1.length + f2.length);
  combined.set(f1, 0);
  combined.set(f2, f1.length);

  const stream = new FrameStreamDecoder();
  const step1 = stream.push(combined.subarray(0, 5));
  const step2 = stream.push(combined.subarray(5, 16));
  const step3 = stream.push(combined.subarray(16));
  return { step1, step2, step3 };
}, {
  step1: [],
  step2: [{ type: 1, flags: 0, seq: 10, payload: "alpha" }],
  step3: [{ type: 2, flags: 1, seq: 11, payload: "bravo" }],
});
```

## Hidden checks

```javascript
expect("decodeFrame throws on bad magic, truncated header, or mismatched payload length", () => {
  const encodeFrame = get("encodeFrame");
  const decodeFrame = get("decodeFrame");
  const good = encodeFrame({ type: 1, flags: 0, seq: 1, payload: "hi" });
  const badMagic = new Uint8Array(good);
  badMagic[0] = 0x00;

  expectThrows("short buffer", () => decodeFrame(good.subarray(0, 7)));
  expectThrows("bad magic", () => decodeFrame(badMagic));
  expectThrows("extra trailing byte", () => {
    const extra = new Uint8Array(good.length + 1);
    extra.set(good, 0);
    decodeFrame(extra);
  });
  return true;
}, true);
```

## Solution

```javascript
const MAGIC = 0x4F50;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function encodeFrame({ type, flags, seq, payload }) {
  const body = encoder.encode(String(payload ?? ""));
  const out = new Uint8Array(8 + body.byteLength);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  view.setUint16(0, MAGIC, false);
  view.setUint8(2, type & 0xff);
  view.setUint8(3, flags & 0xff);
  view.setUint16(4, seq & 0xffff, false);
  view.setUint16(6, body.byteLength, false);
  out.set(body, 8);
  return out;
}

function decodeFrame(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 8) {
    throw new Error("Frame must be at least 8 bytes");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = view.getUint16(0, false);
  if (magic !== MAGIC) {
    throw new Error(`Invalid frame magic: 0x${magic.toString(16)}`);
  }
  const type = view.getUint8(2);
  const flags = view.getUint8(3);
  const seq = view.getUint16(4, false);
  const payloadLen = view.getUint16(6, false);
  if (bytes.byteLength !== 8 + payloadLen) {
    throw new Error(`Frame length mismatch: expected ${8 + payloadLen}, got ${bytes.byteLength}`);
  }
  const payload = decoder.decode(bytes.subarray(8, 8 + payloadLen));
  return { type, flags, seq, payload };
}

class FrameStreamDecoder {
  constructor() {
    this._buf = new Uint8Array(0);
  }

  push(chunk) {
    if (chunk && chunk.byteLength > 0) {
      const merged = new Uint8Array(this._buf.byteLength + chunk.byteLength);
      merged.set(this._buf, 0);
      merged.set(chunk, this._buf.byteLength);
      this._buf = merged;
    }

    const frames = [];
    while (this._buf.byteLength >= 2) {
      const view = new DataView(this._buf.buffer, this._buf.byteOffset, this._buf.byteLength);
      if (view.getUint16(0, false) !== MAGIC) {
        throw new Error("Invalid stream frame magic");
      }
      if (this._buf.byteLength < 8) break;
      const payloadLen = view.getUint16(6, false);
      const totalLen = 8 + payloadLen;
      if (this._buf.byteLength < totalLen) break;
      frames.push(decodeFrame(this._buf.subarray(0, totalLen)));
      this._buf = this._buf.slice(totalLen);
    }
    return frames;
  }
}
```

## Restored

The stream dock binary codec now encodes big-endian protocol headers and reassembles fragmented or concatenated byte chunks without data loss.
