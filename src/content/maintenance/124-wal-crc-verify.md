---
id: maintenance-wal-crc-verify
title: Count intact leading WAL frames
system: Journal desk
symbol: equipment
scene: tests
skills: storage-engines
reviewSkill: storage-engines
prerequisite: mvcc-store
---

## Briefing

After a sudden power loss, a write-ahead log may contain a torn or corrupted frame partway through. Recovery must stop at the first checksum mismatch and never skip ahead to later frames.

## Objective

Write `count_valid_frames(frames)` where `frames` is a list of `(expected_crc, payload_bytes)` tuples.

Return the count of **leading consecutive** frames starting from index `0` whose unsigned 32-bit CRC32 (`zlib.crc32(payload_bytes) & 0xFFFFFFFF`) matches `expected_crc`. Stop immediately upon encountering the first mismatch.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Import `zlib` and compute `zlib.crc32(payload) & 0xFFFFFFFF` for each frame.
2. Break out of the loop as soon as a frame's CRC does not match — do NOT keep counting valid frames after a corrupted one!

## Starter

```python
```

## Checks

```python
import zlib as _z
def _f(b):
    return (_z.crc32(b) & 0xFFFFFFFF, b)
expect("counts all frames when intact", lambda: get("count_valid_frames")([_f(b"a=1"), _f(b"b=2"), _f(b"c=3")]), 3)
expect("stops at first corrupted frame even if later frames are valid", lambda: get("count_valid_frames")([_f(b"a=1"), (0xDEADBEEF, b"torn"), _f(b"c=3")]), 1)
expect("returns 0 when first frame is corrupt", lambda: get("count_valid_frames")([(123, b"bad"), _f(b"ok")]), 0)
```

## Hidden checks

```python
expect("empty WAL returns 0", lambda: get("count_valid_frames")([]), 0)
```

## Solution

```python
import zlib


def count_valid_frames(frames):
    valid = 0
    for expected_crc, payload in frames:
        if (zlib.crc32(payload) & 0xFFFFFFFF) != expected_crc:
            break
        valid += 1
    return valid
```

## Restored

WAL recovery halts cleanly at the first torn frame without replaying unverified tail records.
