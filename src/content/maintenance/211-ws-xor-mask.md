---
id: maintenance-ws-xor-mask
title: Mask and unmask WebSocket payloads with a 4-byte XOR key
system: Frame rack
symbol: equipment
scene: tests
skills: websockets
reviewSkill: websockets
prerequisite: ws-room-broker
---

## Briefing

RFC 6455 mandates that every client-to-server WebSocket frame XOR-masks its payload with a 4-byte key to prevent proxy cache poisoning.

## Objective

Write `apply_ws_mask(payload, mask_key)` where `payload` and `mask_key` are `bytes` and `len(mask_key) == 4` (raise `ValueError` otherwise). Return `bytes(b ^ mask_key[i % 4] for i, b in enumerate(payload))`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate `len(mask_key) == 4` first, then XOR each byte `i` with `mask_key[i % 4]`.

## Starter

```python
```

## Checks

```python
expect("matches RFC 6455 Hello masking example", lambda: get("apply_ws_mask")(b"Hello", b"\x37\xfa\x21\x3d"), b"\x7f\x9f\x4d\x51\x58")
expect("applying the same mask twice recovers original payload", lambda: get("apply_ws_mask")(get("apply_ws_mask")(b"outpost", b"\xaa\xbb\xcc\xdd"), b"\xaa\xbb\xcc\xdd"), b"outpost")
```

## Hidden checks

```python
def _bad_key():
    try:
        get("apply_ws_mask")(b"hi", b"\x01\x02")
        return False
    except ValueError:
        return True
expect("rejects non-4-byte mask key", _bad_key, True)
```

## Solution

```python
def apply_ws_mask(payload, mask_key):
    if len(mask_key) != 4:
        raise ValueError("mask_key must be exactly 4 bytes")
    return bytes(b ^ mask_key[i % 4] for i, b in enumerate(payload))
```

## Restored

WebSocket XOR masking now protects client frames identically in both directions.
