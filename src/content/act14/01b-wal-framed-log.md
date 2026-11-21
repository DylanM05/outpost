---
id: wal-framed-log
kind: code
title: CRC32-checksummed write-ahead log
system: Journal desk
symbol: instrument
scene: tests
skills: storage-engines
---

## Briefing

When power fails mid-disk-write, the last record in a WAL file can be **half-written ("torn")** or contain flipped bytes. Every real storage engine (SQLite, PostgreSQL, RocksDB) wraps each WAL record with a **length prefix** and a **CRC32 checksum** so crash recovery detects torn tails and stops cleanly right before the corruption!

## Objective

Write two functions:

1. `encode_wal_record(payload)` — accepts `payload: bytes` (or UTF-8 `str`), computes `crc = zlib.crc32(raw) & 0xFFFFFFFF`, and returns the binary frame:
   ```python
   len(raw).to_bytes(4, "big") + crc.to_bytes(4, "big") + raw
   ```
2. `recover_wal(stream)` — accepts `stream: bytes` containing zero or more concatenated frames:
   - Parse frames sequentially from offset `0`.
   - Stop cleanly (do **not** raise!) as soon as:
     - fewer than 8 header bytes remain, OR
     - fewer than `length` payload bytes remain (torn tail!), OR
     - the payload's `zlib.crc32(payload) & 0xFFFFFFFF` does not match the stored `crc` (corrupted record!).
   - Return `{"records": [valid_payload_bytes, ...], "valid_bytes": offset_where_valid_log_ended}` (so the engine knows the exact byte offset to truncate the corrupted tail!).

## Concept

Notice why `recover_wal` stops at the first bad frame and returns `valid_bytes`: once the WAL tail is torn by a crash, the engine truncates the file at `valid_bytes` and resumes appending fresh records from a clean boundary — preserving 100% of every valid record written before the outage!

## Hints

1. Use `zlib.crc32(raw) & 0xFFFFFFFF` so the CRC is always an unsigned 32-bit integer.
2. Track `pos = 0`. For each frame: read `length = int.from_bytes(stream[pos:pos+4], "big")` and `crc = int.from_bytes(stream[pos+4:pos+8], "big")`, verify `pos + 8 + length <= len(stream)` and checksum matches, then append payload and advance `pos += 8 + length`.

## Starter: guided

```python
import zlib


def encode_wal_record(payload):
    raw = payload.encode("utf-8") if isinstance(payload, str) else payload
    crc = zlib.crc32(raw) & 0xFFFFFFFF
    return len(raw).to_bytes(4, "big") + crc.to_bytes(4, "big") + raw


def recover_wal(stream):
    records = []
    pos = 0
    n = len(stream)
    while pos + 8 <= n:
        length = int.from_bytes(stream[pos : pos + 4], "big")
        stored_crc = int.from_bytes(stream[pos + 4 : pos + 8], "big")
        # TODO: check enough bytes remain and CRC matches; else break!
        break
    return {"records": records, "valid_bytes": pos}
```

## Starter: standard

```python
import zlib


def encode_wal_record(payload):
    pass


def recover_wal(stream):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
enc = get("encode_wal_record")
rec = get("recover_wal")

r1 = enc(b"PUT freq 147.33")
r2 = enc(b"PUT power 50")
r3 = enc(b"PUT mode winter")

# Truncated tail (simulates power cut halfway through r3)
torn = r1 + r2 + r3[:-4]
expect("recovers intact records and reports exact truncation offset", lambda: rec(torn), {"records": [b"PUT freq 147.33", b"PUT power 50"], "valid_bytes": len(r1) + len(r2)})

# Bit-flipped byte inside r2 -> stops cleanly after r1!
corrupt_r2 = bytearray(r2)
corrupt_r2[-1] ^= 0x01
expect("stops at first CRC-corrupted record", lambda: rec(r1 + bytes(corrupt_r2) + r3), {"records": [b"PUT freq 147.33"], "valid_bytes": len(r1)})
```

## Hidden checks

```python
enc = get("encode_wal_record")
rec = get("recover_wal")
expect("empty WAL stream returns empty list at offset 0", lambda: rec(b""), {"records": [], "valid_bytes": 0})
expect("empty payload record round-trips cleanly", lambda: rec(enc(b"")), {"records": [b""], "valid_bytes": 8})
```

## Solution

```python
import zlib


def encode_wal_record(payload):
    raw = payload.encode("utf-8") if isinstance(payload, str) else payload
    crc = zlib.crc32(raw) & 0xFFFFFFFF
    return len(raw).to_bytes(4, "big") + crc.to_bytes(4, "big") + raw


def recover_wal(stream):
    records = []
    pos = 0
    n = len(stream)
    while pos + 8 <= n:
        length = int.from_bytes(stream[pos : pos + 4], "big")
        stored_crc = int.from_bytes(stream[pos + 4 : pos + 8], "big")
        end = pos + 8 + length
        if end > n:
            break
        payload = stream[pos + 8 : end]
        if (zlib.crc32(payload) & 0xFFFFFFFF) != stored_crc:
            break
        records.append(payload)
        pos = end
    return {"records": records, "valid_bytes": pos}
```

## Restored

Torn tails and single-bit disk flips stop cleanly at the CRC boundary with every prior record recovered intact.
