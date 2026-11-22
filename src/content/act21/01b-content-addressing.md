---
id: content-addressing
title: Deduplicate media blobs with content-addressed storage
system: Blob bench
symbol: instrument
scene: tests
skills: object-storage
---

## Briefing

When five drones upload identical firmware images under different names, storing five copies wastes precious satellite storage. A **content-addressed blob store** keys immutable payloads by their SHA-256 hex digest and reference-counts named keys pointing to each blob.

## Concept

Build `BlobStore`:
- `put(key, data: bytes)` -> returns the lowercase SHA-256 hex digest of `data`:
  - If `key` already pointed to an older digest, decrement that old blob's refcount (and delete the blob if its refcount drops to `0`).
  - Store `data` under `digest` if not already present, and increment `digest`'s refcount.
  - Map `key -> digest`.
- `get(key)` -> returns `bytes` for `key`, or `None` if missing.
- `delete(key)` -> removes `key`, decrements its blob's refcount (garbage-collecting the blob if refcount hits `0`), and returns `True` if `key` existed else `False`.
- `stats()` -> returns `{"keys": len(key_map), "unique_blobs": len(blobs), "stored_bytes": sum(len(b) for b in blobs.values())}`.

## Objective

Implement `BlobStore` with `put`, `get`, `delete`, and `stats` (raising `TypeError` if `data` is not `bytes`).

## Hints

1. Check `if not isinstance(data, bytes): raise TypeError("data must be bytes")`.
2. When overwriting `key` with the *exact same* digest, either no-op cleanly or carefully increment-before-decrement (or decrement old then increment new) so refcount stays accurate!

## Starter: guided

```python
import hashlib


class BlobStore:
    def __init__(self):
        self.key_to_digest = {}
        self.blobs = {}
        self.refs = {}

    def put(self, key, data):
        if not isinstance(data, bytes):
            raise TypeError("data must be bytes")
        digest = hashlib.sha256(data).hexdigest()
        # Handle overwriting an existing key, store blob, update refcounts.
        pass

    def get(self, key):
        pass

    def delete(self, key):
        pass

    def stats(self):
        return {
            "keys": len(self.key_to_digest),
            "unique_blobs": len(self.blobs),
            "stored_bytes": sum(len(b) for b in self.blobs.values()),
        }
```

## Starter: standard

```python
import hashlib


class BlobStore:
    def __init__(self):
        pass

    def put(self, key, data):
        pass

    def get(self, key):
        pass

    def delete(self, key):
        pass

    def stats(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _dedup():
    s = get("BlobStore")()
    d1 = s.put("a.bin", b"firmware-v1")
    d2 = s.put("b.bin", b"firmware-v1")
    s1 = s.stats()
    s.delete("a.bin")
    still_b = s.get("b.bin")
    s.delete("b.bin")
    s2 = s.stats()
    return (d1 == d2, len(d1), s1, still_b, s2)
expect("deduplicates identical blobs and GCs only when last key is deleted", _dedup, (
    True,
    64,
    {"keys": 2, "unique_blobs": 1, "stored_bytes": 11},
    b"firmware-v1",
    {"keys": 0, "unique_blobs": 0, "stored_bytes": 0},
))
```

## Hidden checks

```python
def _overwrite():
    s = get("BlobStore")()
    s.put("img", b"12345")
    s.put("img", b"12345")  # overwrite same content
    s.put("img", b"99")     # overwrite different content -> old blob GC'd
    return (s.get("img"), s.stats(), s.delete("missing"))
expect("overwriting a key reclaims unreferenced old blob", _overwrite, (
    b"99",
    {"keys": 1, "unique_blobs": 1, "stored_bytes": 2},
    False,
))

def _bad_type():
    try:
        get("BlobStore")().put("k", "not-bytes")
        return False
    except TypeError:
        return True
expect("rejects non-bytes payload with TypeError", _bad_type, True)
```

## Solution

```python
import hashlib


class BlobStore:
    def __init__(self):
        self.key_to_digest = {}
        self.blobs = {}
        self.refs = {}

    def _decref(self, digest):
        self.refs[digest] -= 1
        if self.refs[digest] == 0:
            del self.refs[digest]
            del self.blobs[digest]

    def put(self, key, data):
        if not isinstance(data, bytes):
            raise TypeError("data must be bytes")
        digest = hashlib.sha256(data).hexdigest()
        old = self.key_to_digest.get(key)
        if old == digest:
            return digest
        if old is not None:
            self._decref(old)
        if digest not in self.blobs:
            self.blobs[digest] = data
            self.refs[digest] = 0
        self.refs[digest] += 1
        self.key_to_digest[key] = digest
        return digest

    def get(self, key):
        digest = self.key_to_digest.get(key)
        return self.blobs.get(digest) if digest is not None else None

    def delete(self, key):
        digest = self.key_to_digest.pop(key, None)
        if digest is None:
            return False
        self._decref(digest)
        return True

    def stats(self):
        return {
            "keys": len(self.key_to_digest),
            "unique_blobs": len(self.blobs),
            "stored_bytes": sum(len(b) for b in self.blobs.values()),
        }
```

## Restored

The blob bench now deduplicates payloads by SHA-256 and automatically reclaims orphaned data.
