---
id: multipart-upload
title: Assemble S3-style multipart uploads with ETag verification
system: Bucket rack
symbol: equipment
scene: tests
skills: object-storage
---

## Briefing

Large video telemetry files cannot be uploaded reliably in a single HTTP request — if the link drops at 95%, the whole transfer restarts. S3-style **multipart uploads** split a file into independently retriable numbered parts, validate each part's checksum on commit, and assemble the final object atomically.

## Concept

Implement `MultipartManager`:
- `create_upload(key)` -> creates a new pending upload session and returns a unique `upload_id` string (e.g. `"u1"`, `"u2"`, ...).
- `upload_part(upload_id, part_number, data: bytes)` -> requires existing `upload_id`, integer `part_number >= 1`, and `isinstance(data, bytes)` (raise `KeyError` on unknown `upload_id`, `ValueError` on invalid `part_number`, `TypeError` on non-bytes). Stores/replaces that part and returns its SHA-256 hex digest (`etag`).
- `complete_upload(upload_id, manifest)` -> `manifest` is a list of `(part_number, expected_etag)` pairs in **strictly increasing** `part_number` order (raise `ValueError` if empty, unsorted/duplicate, any part is missing, or any `expected_etag` does not match the uploaded part's digest!). On success, concatenates the listed parts in order, stores `objects[key] = assembled_bytes`, deletes the pending upload session, and returns `{"key": key, "size": len(assembled_bytes), "etag": sha256(assembled_bytes).hexdigest()}`.
- `abort_upload(upload_id)` -> deletes the pending upload session and returns `True` if it existed, else `False`.
- `get_object(key)` -> returns assembled `bytes` or `None`.

## Objective

Implement `MultipartManager` with `create_upload`, `upload_part`, `complete_upload`, `abort_upload`, and `get_object`.

## Hints

1. Validate the entire `manifest` BEFORE deleting the upload session so a failed `complete_upload` leaves the session intact for retry!
2. Check strictly increasing part numbers with `prev = 0` and `if part_num <= prev: raise ValueError(...)`.

## Starter: guided

```python
import hashlib


class MultipartManager:
    def __init__(self):
        self._seq = 0
        self.uploads = {}   # upload_id -> {"key": key, "parts": {num: (data, etag)}}
        self.objects = {}   # key -> bytes

    def create_upload(self, key):
        self._seq += 1
        uid = f"u{self._seq}"
        self.uploads[uid] = {"key": key, "parts": {}}
        return uid

    def upload_part(self, upload_id, part_number, data):
        pass

    def complete_upload(self, upload_id, manifest):
        pass

    def abort_upload(self, upload_id):
        return self.uploads.pop(upload_id, None) is not None

    def get_object(self, key):
        return self.objects.get(key)
```

## Starter: standard

```python
import hashlib


class MultipartManager:
    def __init__(self):
        pass

    def create_upload(self, key):
        pass

    def upload_part(self, upload_id, part_number, data):
        pass

    def complete_upload(self, upload_id, manifest):
        pass

    def abort_upload(self, upload_id):
        pass

    def get_object(self, key):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _multipart_ok():
    m = get("MultipartManager")()
    uid = m.create_upload("videos/clip.mp4")
    e2 = m.upload_part(uid, 2, b"WORLD")
    e1 = m.upload_part(uid, 1, b"HELLO-")
    # Re-upload part 2 cleanly before completing
    e2 = m.upload_part(uid, 2, b"OUTPOST")
    res = m.complete_upload(uid, [(1, e1), (2, e2)])
    return (res["key"], res["size"], m.get_object("videos/clip.mp4"), m.abort_upload(uid))
expect("assembles out-of-order and overwritten parts in manifest order", _multipart_ok, (
    "videos/clip.mp4",
    13,
    b"HELLO-OUTPOST",
    False,
))
```

## Hidden checks

```python
def _bad_etag_and_order():
    m = get("MultipartManager")()
    uid = m.create_upload("log.bin")
    e1 = m.upload_part(uid, 1, b"aaa")
    e2 = m.upload_part(uid, 2, b"bbb")
    bad_etag = False
    try:
        m.complete_upload(uid, [(1, "wrong"), (2, e2)])
    except ValueError:
        bad_etag = True
    bad_order = False
    try:
        m.complete_upload(uid, [(2, e2), (1, e1)])
    except ValueError:
        bad_order = True
    # Session must still exist so a valid retry succeeds!
    ok = m.complete_upload(uid, [(1, e1), (2, e2)])
    return (bad_etag, bad_order, ok["size"], m.get_object("log.bin"))
expect("rejects mismatched ETags and unsorted manifests without losing session", _bad_etag_and_order, (True, True, 6, b"aaabbb"))
```

## Solution

```python
import hashlib


class MultipartManager:
    def __init__(self):
        self._seq = 0
        self.uploads = {}
        self.objects = {}

    def create_upload(self, key):
        self._seq += 1
        uid = f"u{self._seq}"
        self.uploads[uid] = {"key": key, "parts": {}}
        return uid

    def upload_part(self, upload_id, part_number, data):
        if upload_id not in self.uploads:
            raise KeyError("unknown upload_id")
        if isinstance(part_number, bool) or not isinstance(part_number, int) or part_number < 1:
            raise ValueError("part_number must be int >= 1")
        if not isinstance(data, bytes):
            raise TypeError("data must be bytes")
        etag = hashlib.sha256(data).hexdigest()
        self.uploads[upload_id]["parts"][part_number] = (data, etag)
        return etag

    def complete_upload(self, upload_id, manifest):
        if upload_id not in self.uploads:
            raise KeyError("unknown upload_id")
        if not manifest:
            raise ValueError("manifest cannot be empty")
        session = self.uploads[upload_id]
        parts = session["parts"]
        chunks = []
        prev = 0
        for part_num, expected_etag in manifest:
            if part_num <= prev:
                raise ValueError("part numbers must be strictly increasing")
            if part_num not in parts:
                raise ValueError(f"missing part {part_num}")
            data, actual_etag = parts[part_num]
            if actual_etag != expected_etag:
                raise ValueError("etag mismatch")
            chunks.append(data)
            prev = part_num
        assembled = b"".join(chunks)
        key = session["key"]
        self.objects[key] = assembled
        del self.uploads[upload_id]
        return {
            "key": key,
            "size": len(assembled),
            "etag": hashlib.sha256(assembled).hexdigest(),
        }

    def abort_upload(self, upload_id):
        return self.uploads.pop(upload_id, None) is not None

    def get_object(self, key):
        return self.objects.get(key)
```

## Restored

The bucket rack now supports resumable multipart uploads with atomic ETag-verified assembly.
