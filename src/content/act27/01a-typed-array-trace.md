---
id: typed-array-trace
kind: predict
language: javascript
title: Trace ArrayBuffer, Uint8Array, DataView endianness, and TextEncoder
system: Stream dock
symbol: instrument
scene: console
skills: js-streams-buffers, reading-code
---

## Briefing

Network sockets, file streams, and binary protocols operate on raw bytes rather than JavaScript strings. The runtime provides `ArrayBuffer` (a fixed-length raw byte allocation) alongside typed views (`Uint8Array`, `DataView`) and UTF-8 codecs (`TextEncoder`, `TextDecoder`).

## Objective

Trace the shared `ArrayBuffer` views below and predict **every line the program prints**.

## Concept

- `new ArrayBuffer(n)` allocates `n` zero-initialized bytes. Multiple views (`new DataView(buf)`, `new Uint8Array(buf)`) share the **exact same underlying memory**.
- `DataView.prototype.setUint16(byteOffset, value, littleEndian)`:
  - When `littleEndian` is `false` (or omitted), the 16-bit integer is written in **big-endian** (network byte order: high byte first, low byte second).
  - When `littleEndian` is `true`, the low byte is written first and the high byte second.
- `new TextEncoder().encode(str)` returns a `Uint8Array` of UTF-8 bytes; `new TextDecoder().decode(bytes)` decodes a `Uint8Array` (or `.subarray(...)` slice) back into a string.

## Hints

1. `0x4F50` in big-endian writes `0x4F` (`79`, ASCII `"O"`) at index `0` and `0x50` (`80`, ASCII `"P"`) at index `1`.
2. `0x0102` in little-endian (`true`) writes the low byte `0x02` (`2`) at index `2` and the high byte `0x01` (`1`) at index `3`.
3. Reading bytes `[2, 1]` at offset `2` in **big-endian** (`view.getUint16(2, false)`) computes `(2 << 8) | 1 = 513`.

## Program

```javascript
const buf = new ArrayBuffer(6);
const view = new DataView(buf);
const bytes = new Uint8Array(buf);

view.setUint16(0, 0x4F50, false);
view.setUint16(2, 0x0102, true);

const tag = new TextEncoder().encode("JS");
bytes.set(tag, 4);

console.log(bytes[0], bytes[1]);
console.log(bytes[2], bytes[3]);
console.log(view.getUint16(2, false));
console.log(
  new TextDecoder().decode(bytes.subarray(0, 2)) +
  new TextDecoder().decode(bytes.subarray(4))
);
```

## Output

```text
79 80
2 1
513
OPJS
```

## Restored

You traced shared `ArrayBuffer` memory across `DataView` endianness operations, `Uint8Array` byte slices, and UTF-8 `TextEncoder`/`TextDecoder` conversions.
