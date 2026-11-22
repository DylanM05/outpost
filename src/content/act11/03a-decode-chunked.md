---
id: decode-chunked
kind: code
title: Decode chunked transfer encoding
system: Chunked wire
symbol: controller
scene: tests
skills: http-protocol
---

## Briefing

When a station streams a live log or generates a large response on the fly, it doesn't know the total `Content-Length` in advance! Instead, HTTP/1.1 sends `Transfer-Encoding: chunked`, prefixing each piece with its **hexadecimal byte length**:

```text
7\r\n
Kestrel\r\n
6\r\n
 Ridge\r\n
0\r\n
\r\n
```

## Objective

Write `decode_chunked(raw)` accepting `raw: bytes` and returning the reassembled body `bytes`:

- Repeatedly read a `<size-line>\r\n`:
  - Ignore any optional chunk extension after `";"` (e.g. `b"a;ext=1"` -> size `0xa` = `10`).
  - Parse the trimmed hex size (`int(size_str, 16)`); raise `ValueError` on invalid hex or negative size.
  - If `size == 0`: consume the terminating blank line `b"\r\n"` (raise `ValueError` if missing!) and return the joined body bytes.
  - Otherwise read exact `size` data bytes followed by `b"\r\n"` (raise `ValueError` if truncated or the chunk does not end with `b"\r\n"`!).

## Concept

Why does every data chunk end with its own `\r\n` even though the byte count `size` is already known?

So binary chunks (which may contain `\r\n` inside the payload!) are framed strictly by exact byte offset `pos + size`, and the trailing `\r\n` acts as a framing sanity check that catches off-by-one bugs immediately.

## Hints

1. Track an integer cursor `pos = 0` inside `raw` so you never slice `raw` repeatedly in O(n²) time!
2. Find the next `\r\n` with `crlf = raw.find(b"\r\n", pos)`. If `crlf == -1`, raise `ValueError`.
3. When `size > 0`, check `raw[data_end : data_end + 2] == b"\r\n"` before advancing `pos = data_end + 2`.

## Starter: guided

```python
def decode_chunked(raw):
    out = bytearray()
    pos = 0
    while True:
        crlf = raw.find(b"\r\n", pos)
        if crlf == -1:
            raise ValueError("unterminated chunk size line")
        size_part = raw[pos:crlf].split(b";", 1)[0].strip()
        try:
            size = int(size_part, 16)
        except ValueError as exc:
            raise ValueError("invalid hex chunk size") from exc
        if size < 0:
            raise ValueError("negative chunk size")
        pos = crlf + 2
        if size == 0:
            # TODO: verify trailing b"\r\n" and return bytes(out)
            pass
        # TODO: check chunk bytes + trailing b"\r\n", extend out, advance pos
        break
```

## Starter: standard

```python
def decode_chunked(raw):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
wire = b"7\r\nKestrel\r\n6\r\n Ridge\r\n0\r\n\r\n"
expect("decodes multi-chunk stream", lambda: get("decode_chunked")(wire), b"Kestrel Ridge")
expect("handles uppercase hex and chunk extensions", lambda: get("decode_chunked")(b"A;foo=bar\r\n0123456789\r\n0\r\n\r\n"), b"0123456789")
expect("handles binary CRLF inside chunk payload", lambda: get("decode_chunked")(b"4\r\na\r\nb\r\n0\r\n\r\n"), b"a\r\nb")
```

## Hidden checks

```python
expect("empty chunked body (0\\r\\n\\r\\n)", lambda: get("decode_chunked")(b"0\r\n\r\n"), b"")
def rejects(bad):
    try:
        get("decode_chunked")(bad)
        return False
    except ValueError:
        return True
check("missing final 0 chunk raises ValueError", lambda: rejects(b"3\r\nabc\r\n"))
check("bad hex raises ValueError", lambda: rejects(b"ZZ\r\nab\r\n0\r\n\r\n"))
check("missing CRLF after chunk data raises ValueError", lambda: rejects(b"3\r\nabcXX0\r\n\r\n"))
```

## Solution

```python
def decode_chunked(raw):
    out = bytearray()
    pos = 0
    while True:
        crlf = raw.find(b"\r\n", pos)
        if crlf == -1:
            raise ValueError("unterminated chunk size line")
        size_bytes = raw[pos:crlf].split(b";", 1)[0].strip()
        if not size_bytes or size_bytes.startswith((b"+", b"-")):
            raise ValueError("invalid chunk size")
        try:
            size = int(size_bytes, 16)
        except ValueError as exc:
            raise ValueError("invalid hex chunk size") from exc
        pos = crlf + 2
        if size == 0:
            if raw[pos : pos + 2] != b"\r\n":
                raise ValueError("missing terminating CRLF")
            return bytes(out)
        end = pos + size
        if end + 2 > len(raw) or raw[end : end + 2] != b"\r\n":
            raise ValueError("truncated or improperly terminated chunk")
        out.extend(raw[pos:end])
        pos = end + 2
```

## Restored

Streaming chunked responses reassemble byte-for-byte — even when the payload itself contains `\r\n` bytes.
