---
id: line-framer
kind: code
title: Frame a CRLF byte stream
system: Stream framer
symbol: instrument
scene: tests
skills: http-protocol
---

## Briefing

HTTP/1.1 separates every request line and header line with **CRLF** (`b"\r\n"`). Build a reusable `LineFramer` class that turns arbitrarily sliced TCP byte chunks into complete lines while buffering partial remainders.

## Objective

Write a class `LineFramer`:

- `__init__(self)` starts with an empty `bytes` buffer (`self.buffer = b""`).
- `feed(self, chunk)` appends `chunk: bytes` to `self.buffer`, extracts every complete `b"\r\n"`-terminated line (without the trailing `b"\r\n"`), updates `self.buffer` to hold only the leftover incomplete bytes, and returns the `list[bytes]` of complete lines extracted from this `feed()` call.

```python
f = LineFramer()
f.feed(b"GET / ")                 # []
f.feed(b"HTTP/1.1\r\nHost: a\r")  # [b"GET / HTTP/1.1"]
f.feed(b"\n\r\n")                 # [b"Host: a", b""]
```

## Concept

Why split on `b"\r\n"` specifically instead of `b"\n"`?

HTTP/1.1 (RFC 9112) mandates CRLF (`\r\n`) line endings. Notice that `\r` and `\n` themselves can be split right down the middle across two TCP packets (`chunk1` ends in `b"\r"`, `chunk2` starts with `b"\n"`). Keeping leftover bytes in `self.buffer` handles split delimiters automatically!

## Hints

1. Append `self.buffer += chunk`, then loop `while b"\r\n" in self.buffer: line, self.buffer = self.buffer.split(b"\r\n", 1)`.
2. Collect each `line` into a local list `lines` and return it.

## Starter: guided

```python
class LineFramer:
    def __init__(self):
        self.buffer = b""

    def feed(self, chunk):
        self.buffer += chunk
        lines = []
        # TODO: while b"\r\n" is in self.buffer, split once and append line
        return lines
```

## Starter: standard

```python
class LineFramer:
    def __init__(self):
        pass

    def feed(self, chunk):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
F = get("LineFramer")
def split_crlf():
    f = F()
    r1 = f.feed(b"GET / ")
    r2 = f.feed(b"HTTP/1.1\r\nHost: kr\r")
    r3 = f.feed(b"\n\r\nBODY")
    return (r1, r2, r3, f.buffer)

expect(
    "handles split lines and split CRLF delimiters",
    split_crlf,
    ([], [b"GET / HTTP/1.1"], [b"Host: kr", b""], b"BODY"),
)
```

## Hidden checks

```python
F = get("LineFramer")
def one_byte_at_a_time():
    f = F()
    msg = b"A\r\nB\r\n\r\n"
    out = []
    for b in msg:
        out.extend(f.feed(bytes([b])))
    return (out, f.buffer)

expect("1-byte-at-a-time streaming yields identical lines", one_byte_at_a_time, ([b"A", b"B", b""], b""))
expect("bare LF without CR stays buffered", lambda: (lambda f: (f.feed(b"line1\nline2"), f.buffer))(F()), ([], b"line1\nline2"))
```

## Solution

```python
class LineFramer:
    def __init__(self):
        self.buffer = b""

    def feed(self, chunk):
        self.buffer += chunk
        lines = []
        while b"\r\n" in self.buffer:
            line, self.buffer = self.buffer.split(b"\r\n", 1)
            lines.append(line)
        return lines
```

## Restored

No matter how the network slices a TCP stream — even one byte per packet — the framer reassembles every CRLF line cleanly.
