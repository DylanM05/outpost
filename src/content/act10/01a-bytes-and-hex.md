---
id: bytes-and-hex
kind: predict
title: Text versus raw bytes
system: Byte decoder
symbol: instrument
scene: console
skills: encoding, reading-code
---

## Briefing

Every cipher in the cipher room operates on **bytes** (`0`–`255`), not Python strings. Before encrypting a single message, trace how UTF-8 text turns into bytes, hexadecimal strings, and integers.

## Objective

Read the program carefully and predict **every line it prints**.

## Concept

A Python `str` is a sequence of Unicode characters; a `bytes` object is a sequence of 8-bit integers (`0` to `255`):

- `text.encode("utf-8")` converts characters to `bytes`. ASCII letters take 1 byte each (`"A"` -> `0x41` = `65`); non-ASCII characters like `"°"` take 2 or more bytes.
- `raw.hex()` turns every byte into two lowercase hex digits (`b"AB".hex() == "4142"`).
- `int.from_bytes(b"\x01\x00", "big")` interprets bytes as an unsigned big-endian integer (`1 * 256 + 0 = 256`).

## Hints

1. `"KR"` is two ASCII bytes: `'K'` is `75` (`0x4b`), `'R'` is `82` (`0x52`).
2. `len("4°")` is `2` characters, whereas `"°"` encodes to 2 UTF-8 bytes (`\xc2\xb0`), so `"4°".encode("utf-8")` has length `3`.
3. `int.from_bytes(b"\x01\x05", "big")` is `1 * 256 + 5 = 261`.

## Program

```python
tag = "KR".encode("utf-8")
print(len(tag), tag[0], tag.hex())

reading = "4°"
raw = reading.encode("utf-8")
print(len(reading), len(raw))

print(int.from_bytes(b"\x01\x05", "big"))
```

## Output

```text
2 75 4b52
2 3
261
```

## Restored

You can tell characters, UTF-8 bytes, hex, and big-endian integers apart on sight — the foundation of every cipher ahead.
