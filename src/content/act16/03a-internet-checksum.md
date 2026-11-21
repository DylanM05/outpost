---
id: internet-checksum
title: Compute the RFC 1071 Internet checksum
system: Stream window
symbol: controller
scene: tests
skills: transport-protocols
---

## Briefing

IPv4 headers, ICMP, UDP, and TCP all verify packet integrity using the **RFC 1071 16-bit one's-complement checksum**. Unlike plain modulo addition, carry bits wrap around from bit 16 back into bit 0!

## Concept

Algorithm over `data: bytes`:
1. If `len(data)` is odd, conceptually pad with a single trailing `0x00` byte so it splits cleanly into 16-bit big-endian words `(hi << 8) | lo`.
2. Sum all 16-bit words into `total`.
3. Fold carries while `total >> 16`: `total = (total & 0xFFFF) + (total >> 16)`.
4. Take the 16-bit one's complement: `~total & 0xFFFF`.

Beautiful property: if you append the 2-byte big-endian checksum to the packet and recompute `internet_checksum(packet_with_checksum)`, the result is always `0x0000` (all ones before complement -> zero after complement)!

## Objective

Implement two functions:
1. `internet_checksum(data)` — computes the 16-bit unsigned integer checksum (`0x0000`..`0xFFFF`) of `data: bytes`.
2. `verify_checksum(data, checksum)` — returns `True` iff `internet_checksum(data) == checksum`.

## Hints

1. If `len(data) % 2 == 1`, append `b"\x00"` to a local copy before pairing bytes with `range(0, len(buf), 2)`.
2. Fold with `while total >> 16: total = (total & 0xFFFF) + (total >> 16)`, then return `~total & 0xFFFF`.

## Starter: guided

```python
def internet_checksum(data):
    buf = data + b"\x00" if len(data) % 2 == 1 else data
    total = 0
    for i in range(0, len(buf), 2):
        word = (buf[i] << 8) | buf[i + 1]
        total += word
    # Fold carries while total >> 16, then return ~total & 0xFFFF
    return 0


def verify_checksum(data, checksum):
    return internet_checksum(data) == checksum
```

## Starter: standard

```python
def internet_checksum(data):
    pass


def verify_checksum(data, checksum):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("matches RFC 1071 example header", lambda: get("internet_checksum")(bytes.fromhex("450000730000400040110000c0a80001c0a800c7")), 0xB861)
expect("including checksum in packet folds to 0", lambda: get("internet_checksum")(bytes.fromhex("45000073000040004011b861c0a80001c0a800c7")), 0)
expect("handles odd-length payloads with zero pad", lambda: get("verify_checksum")(b"ABC", get("internet_checksum")(b"ABC")), True)
```

## Hidden checks

```python
expect("detects single-bit flip", lambda: get("verify_checksum")(b"hello!", get("internet_checksum")(b"hello?")), False)
expect("empty bytes checksum is 0xFFFF", lambda: get("internet_checksum")(b""), 0xFFFF)
```

## Solution

```python
def internet_checksum(data):
    buf = data + b"\x00" if len(data) % 2 == 1 else data
    total = 0
    for i in range(0, len(buf), 2):
        total += (buf[i] << 8) | buf[i + 1]
    while total >> 16:
        total = (total & 0xFFFF) + (total >> 16)
    return ~total & 0xFFFF


def verify_checksum(data, checksum):
    return internet_checksum(data) == checksum
```

## Restored

One's-complement checksums catch corrupted headers and payloads across every packet on the wire.
