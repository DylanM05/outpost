---
id: maintenance-fix-checksum-carry
title: Fix end-around carry in an Internet checksum
system: Stream window
symbol: controller
scene: tests
skills: transport-protocols
reviewSkill: transport-protocols
prerequisite: tcp-aimd-cwnd
---

## Briefing

Packets with high byte values are failing RFC 1071 checksum verification on the relay router! The buggy helper in the editor truncates `total & 0xFFFF` instead of folding overflow carry bits back into the low 16 bits, and crashes on odd-length byte payloads.

## Objective

Fix `ones_complement_checksum(data)` in the editor so it pads odd-length payloads with a trailing `0x00`, folds all carry bits (`while total >> 16: total = (total & 0xFFFF) + (total >> 16)`), and returns the 16-bit one's complement `~total & 0xFFFF`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Pad odd-length `data` with `b"\x00"` before pairing bytes.
2. Replace `total = total & 0xFFFF` with a `while total >> 16:` carry-folding loop before `~total & 0xFFFF`.

## Starter

```python
def ones_complement_checksum(data):
    total = 0
    for i in range(0, len(data), 2):
        total += (data[i] << 8) | data[i + 1]
    total = total & 0xFFFF
    return ~total & 0xFFFF
```

## Checks

```python
expect("folds carries accurately on RFC 1071 header", lambda: get("ones_complement_checksum")(bytes.fromhex("450000730000400040110000c0a80001c0a800c7")), 0xB861)
expect("handles odd-length payload without IndexError", lambda: get("ones_complement_checksum")(b"\xFF\xFF\x01"), 0xFEFF)
```

## Hidden checks

```python
expect("double carry wraps cleanly", lambda: get("ones_complement_checksum")(b"\xFF\xFF\xFF\xFF"), 0x0000)
```

## Solution

```python
def ones_complement_checksum(data):
    buf = data + b"\x00" if len(data) % 2 == 1 else data
    total = 0
    for i in range(0, len(buf), 2):
        total += (buf[i] << 8) | buf[i + 1]
    while total >> 16:
        total = (total & 0xFFFF) + (total >> 16)
    return ~total & 0xFFFF
```

## Restored

End-around carry folding and odd-length padding now produce exact RFC 1071 checksums.
