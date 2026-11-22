---
id: build-cdn-origin
title: Build an end-to-end CDN edge and object-storage origin
system: Depot audit
symbol: controller
scene: tests
assessment: true
skills: object-storage, http-streaming, cdn-caching
---

## Briefing

Tie the entire media depot together in `MediaCDN(secret, allowed_mimes, edge_ttl=60)`: magic-byte-validated content-addressed uploads, presigned URL authorization, edge caching with surrogate-key invalidation, and RFC 9110 `206 Partial Content` byte-range streaming!

## Concept

`MediaCDN(secret, allowed_mimes, edge_ttl=60)`:
- **`upload(key, data: bytes, tags=())`:**
  - Sniffs real MIME type from magic bytes (PNG, JPEG, GIF, WebP, PDF, MP4, else `"application/octet-stream"`).
  - Raises `ValueError` if detected MIME is not in `allowed_mimes`.
  - Stores deduplicated blob by SHA-256 hex digest (maintaining `self.unique_blobs` count via refcounting), records `(digest, mime, set(tags))` for `key`, and immediately invalidates any cached edge copy of `key`!
  - Returns `{"key": key, "etag": digest, "mime": mime, "size": len(data)}`.
- **`presign_get(key, expires)`:**
  - Signs `f"GET\n/{key.lstrip('/')}\n{int(expires)}"` with HMAC-SHA256 using `secret`, returning `f"/{key.lstrip('/')}?expires={int(expires)}&sig={sig}"`.
- **`fetch(signed_path, now, range_header=None)`:**
  - Verifies the presigned URL for `"GET"` at timestamp `now` (using `hmac.compare_digest` and `now <= expires`). If invalid or expired -> return `(403, {"X-Cache": "BYPASS"}, b"")`.
  - Extracts `key = path.lstrip("/")`.
  - Checks the edge cache for `key`: if present and `now - cached_at < edge_ttl`, uses cached `(data, mime, etag)` with `x_cache = "HIT"`; else loads from origin storage (`404` -> `(404, {"X-Cache": "MISS"}, b"")`), increments `self.origin_fetches += 1`, populates edge cache with `tags`, and sets `x_cache = "MISS"`.
  - Applies HTTP `Range` slicing on `data`:
    - No `range_header` -> `200`, headers `{"Content-Type": mime, "ETag": f'"{etag}"', "Content-Length": str(len(data)), "X-Cache": x_cache}`, body `data`.
    - Valid `range_header` (`bytes=a-b`, `bytes=a-`, `bytes=-k`) -> `206`, headers include `"Content-Range": f"bytes {start}-{end}/{total}"`, `"Content-Type": mime`, `"ETag": f'"{etag}"'`, `"Content-Length": str(len(chunk))`, `"X-Cache": x_cache`, body `chunk`.
    - Invalid/unsatisfiable `range_header` -> `416`, headers `{"Content-Range": f"bytes */{total}", "X-Cache": x_cache}`, body `b""`.
- **`purge_tag(tag)`:** Evicts every edge-cached key carrying `tag` (without deleting the origin object!) and returns sorted evicted keys.

## Objective

Implement `MediaCDN` with `upload`, `presign_get`, `fetch`, `purge_tag`, `origin_fetches`, and `unique_blobs` property (or attribute).

## Hints

1. Keep origin storage (`self.objects`, `self.blobs`, `self.refs`) separate from the edge cache (`self.edge_cache`) so `purge_tag` clears the CDN edge while leaving the origin intact for the next miss!
2. Uploading a new version of an existing `key` must also evict `key` from `self.edge_cache` so stale edge data is never served after an overwrite.

## Starter: guided

```python
import hashlib
import hmac
from urllib.parse import parse_qs, urlsplit


class MediaCDN:
    def __init__(self, secret, allowed_mimes, edge_ttl=60):
        self.secret = secret
        self.allowed_mimes = set(allowed_mimes)
        self.edge_ttl = edge_ttl
        self.origin_fetches = 0
        self.blobs = {}
        self.refs = {}
        self.objects = {}
        self.edge_cache = {}

    @property
    def unique_blobs(self):
        return len(self.blobs)

    def upload(self, key, data, tags=()):
        pass

    def presign_get(self, key, expires):
        pass

    def fetch(self, signed_path, now, range_header=None):
        pass

    def purge_tag(self, tag):
        return []
```

## Starter: standard

```python
import hashlib
import hmac
from urllib.parse import parse_qs, urlsplit


class MediaCDN:
    def __init__(self, secret, allowed_mimes, edge_ttl=60):
        pass

    def upload(self, key, data, tags=()):
        pass

    def presign_get(self, key, expires):
        pass

    def fetch(self, signed_path, now, range_header=None):
        pass

    def purge_tag(self, tag):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
_MP4 = b"\x00\x00\x00\x18ftypisom0123456789"

def _cdn_flow():
    cdn = get("MediaCDN")("edge-key", {"video/mp4", "image/png"}, edge_ttl=60)
    u1 = cdn.upload("v/a.mp4", _MP4, tags=["series:1", "hd"])
    u2 = cdn.upload("v/b.mp4", _MP4, tags=["series:1"])
    url = cdn.presign_get("v/a.mp4", expires=500)

    # First fetch: origin MISS, 206 partial range!
    s1, h1, b1 = cdn.fetch(url, now=100, range_header="bytes=0-7")
    # Second fetch within TTL: edge HIT, full 200!
    s2, h2, b2 = cdn.fetch(url, now=120)
    # Purge surrogate tag -> next fetch goes back to origin!
    purged = cdn.purge_tag("series:1")
    s3, h3, b3 = cdn.fetch(url, now=125, range_header="bytes=-4")
    # Expired URL -> 403!
    s4, _, _ = cdn.fetch(url, now=501)
    return (
        u1["mime"],
        u1["etag"] == u2["etag"],
        cdn.unique_blobs,
        (s1, h1["X-Cache"], h1["Content-Range"], b1),
        (s2, h2["X-Cache"], len(b2)),
        purged,
        (s3, h3["X-Cache"], b3),
        s4,
        cdn.origin_fetches,
    )
expect("runs full upload, dedup, presign, edge cache, 206 range, and tag purge lifecycle", _cdn_flow, (
    "video/mp4",
    True,
    1,
    (206, "MISS", "bytes 0-7/22", _MP4[:8]),
    (200, "HIT", 22),
    ["v/a.mp4"],
    (206, "MISS", b"6789"),
    403,
    2,
))
```

## Hidden checks

```python
def _security_and_416():
    cdn = get("MediaCDN")("k", {"image/png"}, edge_ttl=30)
    rejected_html = False
    try:
        cdn.upload("bad.png", b"<script>x</script>")
    except ValueError:
        rejected_html = True
    png = b"\x89PNG\r\n\x1a\nABCD"
    cdn.upload("ok.png", png)
    url = cdn.presign_get("ok.png", 200)
    s416, h416, _ = cdn.fetch(url, now=10, range_header="bytes=99-100")
    s403, _, _ = cdn.fetch(url + "tamper", now=10)
    missing_url = cdn.presign_get("nope.png", 200)
    s404, _, _ = cdn.fetch(missing_url, now=10)
    return (rejected_html, s416, h416["Content-Range"], s403, s404)
expect("blocks disguised MIME uploads, tampered signatures, missing objects, and bad ranges", _security_and_416, (True, 416, "bytes */12", 403, 404))
```

## Solution

```python
import hashlib
import hmac
from urllib.parse import parse_qs, urlsplit


def _sniff(data):
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data.startswith(b"%PDF-"):
        return "application/pdf"
    if len(data) >= 8 and data[4:8] == b"ftyp":
        return "video/mp4"
    return "application/octet-stream"


def _slice_range(payload, range_header):
    total = len(payload)
    if total == 0 or not range_header.startswith("bytes="):
        return None
    spec = range_header[len("bytes="):].strip()
    if "," in spec or "-" not in spec:
        return None
    left, right = spec.split("-", 1)
    try:
        if left == "":
            suffix = int(right)
            if suffix <= 0:
                return None
            start = max(0, total - suffix)
            end = total - 1
        elif right == "":
            start = int(left)
            if start < 0 or start >= total:
                return None
            end = total - 1
        else:
            start = int(left)
            end = int(right)
            if start < 0 or end < start or start >= total:
                return None
            end = min(end, total - 1)
    except ValueError:
        return None
    return (start, end, payload[start : end + 1])


class MediaCDN:
    def __init__(self, secret, allowed_mimes, edge_ttl=60):
        self.secret = secret
        self.allowed_mimes = set(allowed_mimes)
        self.edge_ttl = edge_ttl
        self.origin_fetches = 0
        self.blobs = {}
        self.refs = {}
        self.objects = {}     # key -> (digest, mime, set(tags))
        self.edge_cache = {}  # key -> (data, mime, digest, set(tags), cached_at)

    @property
    def unique_blobs(self):
        return len(self.blobs)

    def _sign(self, path, expires):
        msg = f"GET\n{path}\n{expires}".encode("utf-8")
        return hmac.new(self.secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    def upload(self, key, data, tags=()):
        if not isinstance(data, bytes):
            raise TypeError("data must be bytes")
        mime = _sniff(data)
        if mime not in self.allowed_mimes:
            raise ValueError(f"disallowed MIME type: {mime}")
        norm_key = key.lstrip("/")
        digest = hashlib.sha256(data).hexdigest()
        old = self.objects.get(norm_key)
        if old is not None and old[0] != digest:
            old_digest = old[0]
            self.refs[old_digest] -= 1
            if self.refs[old_digest] == 0:
                del self.refs[old_digest]
                del self.blobs[old_digest]
        if old is None or old[0] != digest:
            if digest not in self.blobs:
                self.blobs[digest] = data
                self.refs[digest] = 0
            self.refs[digest] += 1
        self.objects[norm_key] = (digest, mime, set(tags))
        self.edge_cache.pop(norm_key, None)
        return {"key": norm_key, "etag": digest, "mime": mime, "size": len(data)}

    def presign_get(self, key, expires):
        path = "/" + key.lstrip("/")
        exp = int(expires)
        sig = self._sign(path, exp)
        return f"{path}?expires={exp}&sig={sig}"

    def _verify(self, signed_path, now):
        parts = urlsplit(signed_path)
        qs = parse_qs(parts.query)
        if "expires" not in qs or "sig" not in qs:
            return None
        if len(qs["expires"]) != 1 or len(qs["sig"]) != 1:
            return None
        try:
            expires = int(qs["expires"][0])
        except ValueError:
            return None
        if now > expires:
            return None
        expected = self._sign(parts.path, expires)
        if not hmac.compare_digest(qs["sig"][0], expected):
            return None
        return parts.path.lstrip("/")

    def fetch(self, signed_path, now, range_header=None):
        key = self._verify(signed_path, now)
        if key is None:
            return (403, {"X-Cache": "BYPASS"}, b"")
        entry = self.edge_cache.get(key)
        if entry is not None and (now - entry[4]) < self.edge_ttl:
            data, mime, etag, _, _ = entry
            x_cache = "HIT"
        else:
            self.edge_cache.pop(key, None)
            obj = self.objects.get(key)
            if obj is None:
                return (404, {"X-Cache": "MISS"}, b"")
            etag, mime, tags = obj
            data = self.blobs[etag]
            self.origin_fetches += 1
            if self.edge_ttl > 0:
                self.edge_cache[key] = (data, mime, etag, set(tags), now)
            x_cache = "MISS"

        if range_header is None:
            return (
                200,
                {
                    "Content-Type": mime,
                    "ETag": f'"{etag}"',
                    "Content-Length": str(len(data)),
                    "X-Cache": x_cache,
                },
                data,
            )
        sliced = _slice_range(data, range_header)
        if sliced is None:
            return (416, {"Content-Range": f"bytes */{len(data)}", "X-Cache": x_cache}, b"")
        start, end, chunk = sliced
        return (
            206,
            {
                "Content-Type": mime,
                "ETag": f'"{etag}"',
                "Content-Range": f"bytes {start}-{end}/{len(data)}",
                "Content-Length": str(len(chunk)),
                "X-Cache": x_cache,
            },
            chunk,
        )

    def purge_tag(self, tag):
        evicted = sorted(k for k, entry in self.edge_cache.items() if tag in entry[3])
        for k in evicted:
            del self.edge_cache[k]
        return evicted
```

## Restored

The media depot's edge CDN and deduplicated object origin now authorize, cache, stream, and purge assets end to end.
