---
id: maintenance-js-uint16-be
language: javascript
title: Encode and decode a 4-byte big-endian Uint16 pair with DataView
system: Stream dock
symbol: instrument
scene: tests
skills: js-streams-buffers
reviewSkill: js-streams-buffers
prerequisite: async-stream-pipeline
---

## Briefing

A stream dock header packs two unsigned 16-bit integers (`channel` and `length`) into a 4-byte `Uint8Array` in **big-endian** (network) byte order.

## Objective

Implement `packHeader(channel, length)` returning a 4-byte `Uint8Array` and `unpackHeader(bytes)` returning `{ channel, length }` using `DataView` in big-endian mode (`littleEndian = false`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)` and pass `false` as the `littleEndian` flag to `setUint16` and `getUint16` at byte offsets `0` and `2`.

## Starter

```javascript
function packHeader(channel, length) {
  const out = new Uint8Array(4);
  // Write channel at offset 0 and length at offset 2 in big-endian order
  return out;
}

function unpackHeader(bytes) {
  // Read channel at offset 0 and length at offset 2 in big-endian order
}
```

## Checks

```javascript
expect("packs and unpacks big-endian Uint16 values into 4 bytes", () => {
  const packHeader = get("packHeader");
  const unpackHeader = get("unpackHeader");
  const raw = packHeader(0x0102, 0x0304);
  return {
    bytes: [...raw],
    unpacked: unpackHeader(raw),
  };
}, {
  bytes: [1, 2, 3, 4],
  unpacked: { channel: 0x0102, length: 0x0304 },
});
```

## Hidden checks

```javascript
expect("unpackHeader respects subarray byteOffset", () => {
  const packHeader = get("packHeader");
  const unpackHeader = get("unpackHeader");
  const padded = new Uint8Array(6);
  padded.set(packHeader(512, 1024), 2);
  return unpackHeader(padded.subarray(2));
}, { channel: 512, length: 1024 });
```

## Solution

```javascript
function packHeader(channel, length) {
  const out = new Uint8Array(4);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  view.setUint16(0, channel, false);
  view.setUint16(2, length, false);
  return out;
}

function unpackHeader(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    channel: view.getUint16(0, false),
    length: view.getUint16(2, false),
  };
}
```

## Restored

The stream dock header packer now reads and writes big-endian 16-bit fields cleanly across any `Uint8Array` slice.
