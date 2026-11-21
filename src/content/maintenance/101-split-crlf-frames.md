---
id: maintenance-split-crlf-frames
title: Split a byte buffer on CRLF
system: Stream framer
symbol: instrument
scene: tests
skills: http-protocol
reviewSkill: http-protocol
prerequisite: serialize-response
---

## Briefing

Stream protocols buffer raw TCP bytes and peel off complete `\r\n`-delimited lines while returning any partial remainder for the next socket read.

## Objective

Write `split_crlf(buffer)` accepting `buffer: bytes`. Return `(lines, remainder)` where `lines` is a `list[bytes]` of all complete `b"\r\n"`-terminated segments (without `b"\r\n"`), and `remainder` is the leftover trailing `bytes` after the last `b"\r\n"`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. `parts = buffer.split(b"\r\n")`: `parts[:-1]` are all complete lines, and `parts[-1]` is the exact remainder!

## Starter

```python
```

## Checks

```python
expect("splits complete lines and leaves trailing remainder", lambda: get("split_crlf")(b"A\r\nB\r\npar"), ([b"A", b"B"], b"par"))
expect("no CRLF keeps entire buffer as remainder", lambda: get("split_crlf")(b"partial\nonly"), ([], b"partial\nonly"))
```

## Hidden checks

```python
expect("trailing CRLF gives empty remainder", lambda: get("split_crlf")(b"one\r\n\r\n"), ([b"one", b""], b""))
expect("empty bytes", lambda: get("split_crlf")(b""), ([], b""))
```

## Solution

```python
def split_crlf(buffer):
    parts = buffer.split(b"\r\n")
    return parts[:-1], parts[-1]
```

## Restored

One clean split handles empty lines, bare LFs, and partial tails in linear time.
