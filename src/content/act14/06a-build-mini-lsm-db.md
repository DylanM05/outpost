---
id: build-mini-lsm-db
kind: code
title: Build a crash-recoverable MiniLSM database
system: Vault audit
symbol: controller
scene: tests
skills: storage-engines, search-indexing
assessment: true
---

## Briefing

Time to bring the entire storage vault online! Build **`MiniLSM`**, a working LSM-tree key-value database engine with:
1. A **CRC32-checksummed Write-Ahead Log (WAL)** so crashes with torn tails never corrupt or lose committed writes.
2. An in-memory **memtable** that automatically flushes to immutable **SSTables** guarded by **Bloom filters** once it reaches `memtable_limit` keys.
3. Tombstone deletions (`delete(key)`), merged range scans (`scan(low, high)`), and **compaction** (`compact()`) that collapses all SSTables into one tombstoneless level!

This is the final independent mission for **The storage vault**.

## Objective

Implement a class `MiniLSM`:

- `__init__(self, memtable_limit=4)`:
  - Validate `memtable_limit >= 1` (`ValueError` otherwise).
  - Initializes an empty memtable (`dict`), empty list of flushed SSTables (ordered newest-first), and an in-memory WAL byte buffer (`bytearray`) holding CRC32-framed JSON records (`len4 + crc4 + json_bytes`).
- `put(self, key, value)`:
  - Validate `isinstance(key, str)` and `value is not None` (`ValueError` otherwise).
  - Append a CRC32-framed record `{"op": "PUT", "key": key, "value": value}` to the WAL **first**, then set `memtable[key] = value`.
  - If `len(memtable) >= self.memtable_limit`: flush the memtable into a new immutable SSTable (with its own Bloom filter!) at the front of `self.sstables` and clear `memtable`.
- `delete(self, key)`:
  - Append a CRC32-framed record `{"op": "DEL", "key": key}` to the WAL **first**, then record a tombstone `memtable[key] = None` (flushing if `len(memtable) >= self.memtable_limit`).
- `get(self, key)`:
  - Check `memtable` first (if present, return `memtable[key]`, which is `None` for a tombstone!).
  - Otherwise check flushed SSTables from **newest to oldest**: skip any SSTable whose Bloom filter says `might_contain(key) == False`; if found, return its value (stopping immediately on a `None` tombstone!).
  - Return `None` if absent everywhere.
- `scan(self, low, high)`:
  - Return a sorted list of live `(key, value)` pairs with `low <= key <= high` across `memtable` + all SSTables, where newer entries shadow older ones and `None` tombstones hide deleted keys completely!
- `compact(self)`:
  - Merge all flushed SSTables (newest to oldest) into a **single** SSTable (dropping surviving tombstones since no older levels exist!) and rebuild its Bloom filter. (Leave current `memtable` untouched; if there were no SSTables, remain empty.)
- `wal_bytes(self)` -> returns `bytes(self._wal)`.
- `sstable_count(self)` -> returns `len(self._sstables)`.
- `@classmethod def recover(cls, wal_bytes, memtable_limit=4)`:
  - Recovers all valid CRC32-framed records from `wal_bytes` (stopping cleanly at the first truncated or CRC-corrupted tail record!) and replays every `PUT`/`DEL` into a fresh `MiniLSM(memtable_limit=memtable_limit)` instance!

## Concept

This finale unites every piece of a modern storage engine:
- **WAL + CRC32 framing** (`Journal desk`) -> durability & torn-tail crash safety
- **Memtable + SSTables + Bloom filters + k-way compaction** (`Memtable rack`) -> fast sequential writes, skipped disk reads, clean tombstone reclamation

## Hints

1. Use `json.dumps({"op": "PUT", "key": key, "value": value}).encode("utf-8")` wrapped in `len4 + crc4 + payload` for WAL frames.
2. For `scan(low, high)`, pass `[sorted(self._memtable.items()), *(t.entries for t in self._sstables)]` through your newest-wins k-way merger with `drop_tombstones=True` and filter `low <= k <= high`!
3. Make sure `compact()` shrinks `sstable_count()` to `1` (or `0` if empty after dropping all tombstones!) without losing any live key or resurrecting any deleted key!

## Starter: guided

```python
```

## Starter: standard

```python
```

## Starter: challenge

```python
```

## Checks

```python
LSM = get("MiniLSM")

def test_flush_delete_scan_compact():
    db = LSM(memtable_limit=3)
    for i in range(8):
        db.put(f"k{i}", i * 10)
    db.put("k1", 999)      # overwrite flushed key
    db.delete("k2")        # delete flushed key
    db.put("k9", 90)
    flushed_before = db.sstable_count()
    got_vals = (db.get("k0"), db.get("k1"), db.get("k2"), db.get("k9"), db.get("missing"))
    scanned = db.scan("k0", "k4")
    db.compact()
    flushed_after = db.sstable_count()
    after_compact = (db.get("k0"), db.get("k1"), db.get("k2"), db.scan("k0", "k4"))
    return (flushed_before >= 2, got_vals, scanned, flushed_after <= 1, after_compact)

expect(
    "flushes SSTables, handles overwrites/tombstones/scans, and compacts cleanly",
    test_flush_delete_scan_compact,
    (
        True,
        (0, 999, None, 90, None),
        [("k0", 0), ("k1", 999), ("k3", 30), ("k4", 40)],
        True,
        (0, 999, None, [("k0", 0), ("k1", 999), ("k3", 30), ("k4", 40)]),
    ),
)

def test_crash_recovery():
    db = LSM(memtable_limit=2)
    db.put("a", "alpha")
    db.put("b", "beta")
    db.put("c", "gamma")
    db.delete("a")
    good_wal = db.wal_bytes()
    # Append torn garbage tail simulating power cut mid-write
    torn_wal = good_wal + b"\x00\x00\x00\x20\xde\xad\xbe\xefpartial"
    recovered = LSM.recover(torn_wal, memtable_limit=2)
    return (recovered.get("a"), recovered.get("b"), recovered.get("c"), recovered.scan("a", "z"))

expect(
    "recovers intact state from WAL with torn tail",
    test_crash_recovery,
    (None, "beta", "gamma", [("b", "beta"), ("c", "gamma")]),
)
```

## Hidden checks

```python
LSM = get("MiniLSM")
def test_resurrect_after_delete_and_compact():
    db = LSM(memtable_limit=2)
    db.put("x", 1)
    db.put("y", 2)
    db.delete("x")
    db.put("z", 3)
    db.compact()
    assert db.get("x") is None
    db.put("x", 42)
    return (db.get("x"), db.get("y"), db.get("z"))

expect("re-inserting a key after delete+compact works cleanly", test_resurrect_after_delete_and_compact, (42, 2, 3))

def test_corrupt_middle_stops_recovery():
    db = LSM(memtable_limit=4)
    db.put("k1", "ok1")
    w1 = db.wal_bytes()
    db.put("k2", "ok2")
    w2 = bytearray(db.wal_bytes())
    w2[-1] ^= 0xFF   # corrupt last byte of k2 record
    rec = LSM.recover(bytes(w2), memtable_limit=4)
    return (rec.get("k1"), rec.get("k2"), len(w1) < len(w2))

expect("CRC corruption in tail record prevents bad write from applying", test_corrupt_middle_stops_recovery, ("ok1", None, True))
```

## Solution

```python
import bisect
import hashlib
import heapq
import json
import zlib


class _Bloom:
    def __init__(self, num_bits=256, num_hashes=4):
        self.num_bits = num_bits
        self.num_hashes = num_hashes
        self._bits = 0

    def _pos(self, key):
        return [
            int.from_bytes(hashlib.sha256(f"{i}:{key}".encode("utf-8")).digest()[:8], "big") % self.num_bits
            for i in range(self.num_hashes)
        ]

    def add(self, key):
        for p in self._pos(key):
            self._bits |= 1 << p

    def might_contain(self, key):
        return all((self._bits >> p) & 1 for p in self._pos(key))


class _SSTable:
    def __init__(self, entries):
        self.entries = list(entries)
        self._keys = [k for k, _ in self.entries]
        self.bloom = _Bloom(max(128, len(self.entries) * 16), 4)
        for k in self._keys:
            self.bloom.add(k)

    def get(self, key):
        if not self.bloom.might_contain(key):
            return False, None
        idx = bisect.bisect_left(self._keys, key)
        if idx < len(self._keys) and self._keys[idx] == key:
            return True, self.entries[idx][1]
        return False, None


def _merge(tables, drop_tombstones=False):
    heap = []
    for t_idx, entries in enumerate(tables):
        if entries:
            k, v = entries[0]
            heapq.heappush(heap, (k, t_idx, 0, v))
    out = []
    last_key = object()
    while heap:
        key, t_idx, e_idx, val = heapq.heappop(heap)
        nxt = e_idx + 1
        if nxt < len(tables[t_idx]):
            nk, nv = tables[t_idx][nxt]
            heapq.heappush(heap, (nk, t_idx, nxt, nv))
        if key != last_key:
            last_key = key
            if not (drop_tombstones and val is None):
                out.append((key, val))
    return out


class MiniLSM:
    def __init__(self, memtable_limit=4):
        if memtable_limit < 1:
            raise ValueError("memtable_limit must be >= 1")
        self.memtable_limit = memtable_limit
        self._memtable = {}
        self._sstables = []
        self._wal = bytearray()

    def _append_wal(self, record):
        raw = json.dumps(record, separators=(",", ":")).encode("utf-8")
        crc = zlib.crc32(raw) & 0xFFFFFFFF
        self._wal.extend(len(raw).to_bytes(4, "big") + crc.to_bytes(4, "big") + raw)

    def _maybe_flush(self):
        if len(self._memtable) >= self.memtable_limit:
            entries = sorted(self._memtable.items(), key=lambda kv: kv[0])
            self._sstables.insert(0, _SSTable(entries))
            self._memtable.clear()

    def put(self, key, value):
        if not isinstance(key, str) or value is None:
            raise ValueError("key must be str and value must not be None")
        self._append_wal({"op": "PUT", "key": key, "value": value})
        self._memtable[key] = value
        self._maybe_flush()

    def delete(self, key):
        if not isinstance(key, str):
            raise ValueError("key must be str")
        self._append_wal({"op": "DEL", "key": key})
        self._memtable[key] = None
        self._maybe_flush()

    def get(self, key):
        if key in self._memtable:
            return self._memtable[key]
        for table in self._sstables:
            found, val = table.get(key)
            if found:
                return val
        return None

    def scan(self, low, high):
        if low > high:
            return []
        tables = [sorted(self._memtable.items(), key=lambda kv: kv[0])] + [t.entries for t in self._sstables]
        merged = _merge(tables, drop_tombstones=True)
        return [(k, v) for k, v in merged if low <= k <= high]

    def compact(self):
        if not self._sstables:
            return
        merged = _merge([t.entries for t in self._sstables], drop_tombstones=True)
        self._sstables = [_SSTable(merged)] if merged else []

    def wal_bytes(self):
        return bytes(self._wal)

    def sstable_count(self):
        return len(self._sstables)

    @classmethod
    def recover(cls, wal_bytes, memtable_limit=4):
        db = cls(memtable_limit=memtable_limit)
        pos = 0
        n = len(wal_bytes)
        while pos + 8 <= n:
            length = int.from_bytes(wal_bytes[pos : pos + 4], "big")
            stored_crc = int.from_bytes(wal_bytes[pos + 4 : pos + 8], "big")
            end = pos + 8 + length
            if end > n:
                break
            raw = wal_bytes[pos + 8 : end]
            if (zlib.crc32(raw) & 0xFFFFFFFF) != stored_crc:
                break
            try:
                rec = json.loads(raw.decode("utf-8"))
            except Exception:
                break
            op = rec.get("op")
            if op == "PUT":
                db.put(rec["key"], rec["value"])
            elif op == "DEL":
                db.delete(rec["key"])
            else:
                break
            pos = end
        return db
```

## Restored

The storage vault's LSM database survives power cuts, torn WAL tails, overwrites, tombstone deletes, and full level compaction without losing a single byte!
