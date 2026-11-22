---
id: encode-chunked
kind: code
title: Encode a chunked HTTP stream
system: Chunked wire
symbol: controller
scene: tests
skills: http-protocol
---

## Briefing

Now build the sender side: split any payload into fixed-size hex-framed HTTP/1.1 chunks ending with the zero-length terminator `b"0\r\n\r\n"`.

## Objective

Write `encode_chunked(body, chunk_size=16)`:

- Validate `chunk_size >= 1` (raise `ValueError` otherwise).
- Accept `body` as `bytes` (or `str`, encoded as UTF-8).
- Slice `body` into pieces of at most `chunk_size` bytes. For each non-empty piece `part`, emit:
  ```python
  f"{len(part):x}\r\n".encode("ascii") + part + b"\r\n"
  ```
- Always append the final terminator `b"0\r\n\r\n"` (so an empty body encodes to `b"0\r\n\r\n"`).

```python
encode_chunked(b"Kestrel Ridge", chunk_size=7)
# b"7\r\nKestrel\r\n6\r\n Ridge\r\n0\r\n\r\n"
```

## Concept

Notice the format specifier `f"{len(part):x}"`: `:x` formats an integer in lowercase hexadecimal without a `0x` prefix (`10` -> `"a"`, `16` -> `"10"`). And remember: never emit a zero-length chunk in the middle of a stream, because the receiver stops reading the moment it sees `0\r\n`!

## Hints

1. Check `if chunk_size < 1: raise ValueError(...)`.
2. Loop `for i in range(0, len(raw), chunk_size):` and build each piece `raw[i : i + chunk_size]`.
3. Join all pieces plus `b"0\r\n\r\n"`.

## Starter: guided

```python
def encode_chunked(body, chunk_size=16):
    if chunk_size < 1:
        raise ValueError("chunk_size must be >= 1")
    raw = body.encode("utf-8") if isinstance(body, str) else body
    parts = []
    # TODO: slice raw into chunk_size blocks, prefix each with lowercase hex len + b"\r\n"
    parts.append(b"0\r\n\r\n")
    return b"".join(parts)
```

## Starter: standard

```python
def encode_chunked(body, chunk_size=16):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("encodes into 7-byte chunks", lambda: get("encode_chunked")(b"Kestrel Ridge", 7), b"7\r\nKestrel\r\n6\r\n Ridge\r\n0\r\n\r\n")
expect("uses lowercase hex for sizes >= 10", lambda: get("encode_chunked")(b"0123456789ab", 10), b"a\r\n0123456789\r\n2\r\nab\r\n0\r\n\r\n")
expect("empty body encodes to 0\\r\\n\\r\\n", lambda: get("encode_chunked")(b"", 8), b"0\r\n\r\n")
```

## Hidden checks

```python
expect("encodes UTF-8 str by byte length, not char count", lambda: get("encode_chunked")("4°", 10), b"3\r\n4\xc2\xb0\r\n0\r\n\r\n")
def bad_chunk_size():
    try:
        get("encode_chunked")(b"hi", 0)
        return False
    except ValueError:
        return True
check("chunk_size < 1 raises ValueError", bad_chunk_size)
```

## Solution

```python
def encode_chunked(body, chunk_size=16):
    if chunk_size < 1:
        raise ValueError("chunk_size must be >= 1")
    raw = body.encode("utf-8") if isinstance(body, str) else body
    parts = []
    for i in range(0, len(raw), chunk_size):
        chunk = raw[i : i + chunk_size]
        parts.append(f"{len(chunk):x}\r\n".encode("ascii") + chunk + b"\r\n")
    parts.append(b"0\r\n\r\n")
    return b"".join(parts)
```

## Restored

Chunked encoding streams UTF-8 and binary payloads smoothly without needing a precomputed total length.
