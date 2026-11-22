---
id: http-byte-ranges
title: Serve HTTP 206 Partial Content byte ranges
system: Range deck
symbol: instrument
scene: tests
skills: http-streaming
---

## Briefing

Video scrubbing and resumable downloads rely on HTTP `Range` requests (`RFC 9110`): a client asks for a slice of bytes (`bytes=0-99`, `bytes=500-`, or suffix `bytes=-128`), and the file server answers with `206 Partial Content` and an exact `Content-Range` header — or `416 Range Not Satisfiable` when the range is out of bounds.

## Concept

Given `payload: bytes` (total length `N = len(payload)`) and an optional `range_header: str | None`:
- If `range_header` is `None`: return `(200, {"Content-Length": str(N)}, payload)`.
- Otherwise `range_header` must start with `"bytes="` with a single `<start>-<end>` spec (no multi-range commas):
  1. **Both bounds** (`"a-b"`): `start = int(a)`, `end = min(int(b), N - 1)`. Valid iff `0 <= start <= end < N`.
  2. **Open-ended** (`"a-"`): `start = int(a)`, `end = N - 1`. Valid iff `0 <= start < N`.
  3. **Suffix** (`"-k"`): last `k` bytes (`k = int(k)`). Valid iff `k > 0` and `N > 0`; `start = max(0, N - k)`, `end = N - 1`.
- If the spec is invalid or unsatisfiable (`N == 0`, `start >= N`, `start > end`, negative values, etc.):
  - Return `(416, {"Content-Range": f"bytes */{N}"}, b"")`.
- On a valid range:
  - `chunk = payload[start : end + 1]`
  - Return `(206, {"Content-Range": f"bytes {start}-{end}/{N}", "Content-Length": str(len(chunk))}, chunk)`.

## Objective

Write `serve_range(payload, range_header=None)` returning `(status, headers, body)` following the RFC 9110 rules above.

## Hints

1. Remember HTTP byte ranges are **inclusive** on both ends (`bytes=0-3` is 4 bytes: `payload[0:4]`)!
2. If `end >= N`, RFC 9110 clamps `end` down to `N - 1` (as long as `start < N`).

## Starter: guided

```python
def serve_range(payload, range_header=None):
    total = len(payload)
    if range_header is None:
        return (200, {"Content-Length": str(total)}, payload)
    if not range_header.startswith("bytes="):
        return (416, {"Content-Range": f"bytes */{total}"}, b"")
    spec = range_header[len("bytes="):].strip()
    # Parse start-end, start-, or -suffix; return 206 with Content-Range or 416.
    pass
```

## Starter: standard

```python
def serve_range(payload, range_header=None):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("no Range header returns 200 full body", lambda: get("serve_range")(b"0123456789", None), (200, {"Content-Length": "10"}, b"0123456789"))
expect("explicit inclusive slice returns 206", lambda: get("serve_range")(b"0123456789", "bytes=2-5"), (206, {"Content-Range": "bytes 2-5/10", "Content-Length": "4"}, b"2345"))
expect("open-ended range returns tail", lambda: get("serve_range")(b"0123456789", "bytes=7-"), (206, {"Content-Range": "bytes 7-9/10", "Content-Length": "3"}, b"789"))
expect("suffix range returns last k bytes", lambda: get("serve_range")(b"0123456789", "bytes=-3"), (206, {"Content-Range": "bytes 7-9/10", "Content-Length": "3"}, b"789"))
expect("out-of-bounds start returns 416", lambda: get("serve_range")(b"0123456789", "bytes=15-20"), (416, {"Content-Range": "bytes */10"}, b""))
```

## Hidden checks

```python
expect("clamps end past EOF to total-1", lambda: get("serve_range")(b"abcdef", "bytes=4-999"), (206, {"Content-Range": "bytes 4-5/6", "Content-Length": "2"}, b"ef"))
expect("suffix larger than total returns whole file as 206", lambda: get("serve_range")(b"abc", "bytes=-50"), (206, {"Content-Range": "bytes 0-2/3", "Content-Length": "3"}, b"abc"))
expect("inverted range returns 416", lambda: get("serve_range")(b"abcdef", "bytes=4-2"), (416, {"Content-Range": "bytes */6"}, b""))
expect("empty payload returns 416 for any Range", lambda: get("serve_range")(b"", "bytes=0-0"), (416, {"Content-Range": "bytes */0"}, b""))
```

## Solution

```python
def serve_range(payload, range_header=None):
    total = len(payload)
    if range_header is None:
        return (200, {"Content-Length": str(total)}, payload)
    unsatisfiable = (416, {"Content-Range": f"bytes */{total}"}, b"")
    if total == 0 or not range_header.startswith("bytes="):
        return unsatisfiable
    spec = range_header[len("bytes="):].strip()
    if "," in spec or "-" not in spec:
        return unsatisfiable
    left, right = spec.split("-", 1)
    try:
        if left == "":
            suffix = int(right)
            if suffix <= 0:
                return unsatisfiable
            start = max(0, total - suffix)
            end = total - 1
        elif right == "":
            start = int(left)
            if start < 0 or start >= total:
                return unsatisfiable
            end = total - 1
        else:
            start = int(left)
            end = int(right)
            if start < 0 or end < start or start >= total:
                return unsatisfiable
            end = min(end, total - 1)
    except ValueError:
        return unsatisfiable
    chunk = payload[start : end + 1]
    return (
        206,
        {
            "Content-Range": f"bytes {start}-{end}/{total}",
            "Content-Length": str(len(chunk)),
        },
        chunk,
    )
```

## Restored

The range deck now streams seekable video and resumable downloads with strict RFC 9110 `206`/`416` responses.
