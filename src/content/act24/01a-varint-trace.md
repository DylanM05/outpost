---
id: varint-trace
kind: predict
title: Trace Base-128 varint byte encoding for small vs. large integers
system: Socket bench
symbol: instrument
scene: console
skills: protobuf-grpc, reading-code
---

## Briefing

JSON serializes the integer `150` as three ASCII characters `"150"` (or fixed 64-bit binary wastes 8 bytes). **Protocol Buffers** uses **Base-128 varints**: 7 payload bits per byte (least-significant group first), with the top bit (`0x80`) set to `1` if more bytes follow!

## Objective

Trace the Base-128 varint encoder below and predict **every line it prints**.

## Concept

For `n = 150` (`0b10010110`):
- First 7 bits: `150 & 0x7f = 0b0010110 = 22`; `150 >> 7 = 1` (nonzero -> set continuation bit `0x80`: `22 | 0x80 = 150 = 0x96`).
- Remaining bits: `1` (final byte -> continuation bit `0`: `0x01`).
- Result: `96 01` (2 bytes!).
- Meanwhile `n = 1` takes just `01` (1 byte), and `n = 127` takes `7f` (1 byte), whereas `n = 128` spills to `80 01` (2 bytes)!

## Hints

1. Check `encode_varint(1)` (`01`), `encode_varint(127)` (`7f`), `encode_varint(128)` (`80 01`), and `encode_varint(300)` (`300 = 0b10_0101100` -> low 7 bits `0b0101100 = 44`, `44 | 128 = 172 = 0xac`; high bits `2 = 0x02` -> `ac 02`).

## Program

```python
def encode_varint(n):
    out = bytearray()
    while True:
        chunk = n & 0x7F
        n >>= 7
        if n:
            out.append(chunk | 0x80)
        else:
            out.append(chunk)
            break
    return " ".join(f"{b:02x}" for b in out)

for val in [1, 127, 128, 300]:
    print(f"{val} -> {encode_varint(val)}")
```

## Output

```text
1 -> 01
127 -> 7f
128 -> 80 01
300 -> ac 02
```

## Restored

You traced how Base-128 varints pack small numbers into a single byte while scaling smoothly to arbitrary widths.
