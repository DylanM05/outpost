---
id: tcp-is-a-stream
kind: predict
title: TCP is a stream, not messages
system: Stream framer
symbol: instrument
scene: console
skills: http-protocol, reading-code
---

## Briefing

In Act VII you worked with already-parsed HTTP requests. Underneath every HTTP request sits a raw **TCP byte stream**. TCP guarantees bytes arrive in order — **not** in the chunks the sender wrote! One line may split across two packets, or two lines may arrive glued together in one packet.

## Objective

Trace the buffering loop below and predict **every line it prints**.

## Concept

When reading from a TCP socket, calling `recv(8)` might return 3 bytes, 8 bytes, or half a header line followed by the start of the next line. Every stream parser keeps a `buf = b""` accumulator:

1. Append incoming bytes: `buf += chunk`.
2. Repeatedly peel off complete messages whenever the delimiter (`b"\r\n"` in HTTP/1.1) appears in `buf`.
3. Leave any partial trailing bytes in `buf` for the next chunk!

## Hints

1. Chunk 1 (`b"GET / "`) has no `\r\n`, so `lines` stays empty (`0`).
2. Chunk 2 (`b"HTTP/1.1\r\nHost: kr\r\n\r"`) completes **two** `\r\n`-terminated lines and leaves `b"\r"` in `buf`.
3. Chunk 3 (`b"\n"`) completes the empty blank line `b""` (separating headers from body!).

## Program

```python
chunks = [b"GET / ", b"HTTP/1.1\r\nHost: kr\r\n\r", b"\n"]
buf = b""
for i, chunk in enumerate(chunks, 1):
    buf += chunk
    found = []
    while b"\r\n" in buf:
        line, buf = buf.split(b"\r\n", 1)
        found.append(line.decode("ascii"))
    print(i, len(found), found)
```

## Output

```text
1 0 []
2 2 ['GET / HTTP/1.1', 'Host: kr']
3 1 ['']
```

## Restored

You traced how arbitrary TCP splits reassemble cleanly once a framer buffers around `\r\n`.
