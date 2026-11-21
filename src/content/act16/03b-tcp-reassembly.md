---
id: tcp-reassembly
title: Reassemble out-of-order TCP segments
system: Stream window
symbol: controller
scene: tests
skills: transport-protocols
---

## Briefing

IP packets arrive out of order, get duplicated, and sometimes partially overlap after retransmissions. TCP hides all of that chaos behind a clean byte stream by buffering out-of-order segments and advancing the cumulative `ack` number whenever contiguous bytes fill in.

## Concept

Track:
- `self.next_seq` (initialized to `isn`, default `0`) — the next contiguous sequence number expected (which is also the cumulative `ACK`!).
- `self.buffer` — dict mapping future `seq -> byte_int` (or stored spans) for bytes with `seq >= self.next_seq`.
- `self.ready` — `bytearray` of contiguous in-order bytes ready to be read by the application.

When `push(seq, payload: bytes)` arrives:
- For each index `offset, byte in enumerate(payload)`:
  - `pos = seq + offset`
  - If `pos < self.next_seq`, ignore (already delivered / duplicate!).
  - Otherwise store `self.buffer.setdefault(pos, byte)` (keep first byte if overlapping retransmit).
- Drain contiguous bytes: while `self.next_seq in self.buffer`, append `self.buffer.pop(self.next_seq)` to `self.ready` and increment `self.next_seq += 1`!

## Objective

Implement `TcpReassembler(isn=0)` with:
- `push(self, seq, payload: bytes)` — ingests a segment and returns the updated cumulative `ack` (`self.next_seq`).
- `read(self)` — drains and returns all currently available contiguous `bytes` (leaving `self.ready` empty).
- `ack(self)` — returns the current `self.next_seq`.

## Hints

1. Storing buffered future bytes in `dict[int, int]` makes arbitrary partial overlaps trivial (`if pos >= self.next_seq: self.buffer.setdefault(pos, b)`).
2. In `read()`, capture `out = bytes(self.ready)`, call `self.ready.clear()`, and return `out`.

## Starter: guided

```python
class TcpReassembler:
    def __init__(self, isn=0):
        self.next_seq = isn
        self.buffer = {}
        self.ready = bytearray()

    def push(self, seq, payload):
        for offset, b in enumerate(payload):
            pos = seq + offset
            if pos >= self.next_seq:
                self.buffer.setdefault(pos, b)
        # Drain contiguous bytes starting at self.next_seq into self.ready
        return self.next_seq

    def read(self):
        out = bytes(self.ready)
        self.ready.clear()
        return out

    def ack(self):
        return self.next_seq
```

## Starter: standard

```python
class TcpReassembler:
    def __init__(self, isn=0):
        pass

    def push(self, seq, payload):
        pass

    def read(self):
        pass

    def ack(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _ooo():
    r = get("TcpReassembler")(isn=100)
    a1 = r.push(105, b"world")
    out1 = r.read()
    a2 = r.push(100, b"hello")
    out2 = r.read()
    return (a1, out1, a2, out2)
expect("buffers future segment until gap closes", _ooo, (100, b"", 110, b"helloworld"))

def _overlap():
    r = get("TcpReassembler")(isn=0)
    r.push(0, b"abc")
    r.push(2, b"cdef")
    r.push(0, b"ab")
    return (r.ack(), r.read(), r.read())
expect("handles overlapping and duplicate retransmits cleanly", _overlap, (6, b"abcdef", b""))
```

## Hidden checks

```python
def _staggered():
    r = get("TcpReassembler")(isn=10)
    r.push(14, b"EF")
    r.push(12, b"CD")
    r.push(10, b"AB")
    return (r.ack(), r.read())
expect("chains multiple buffered segments when head arrives", _staggered, (16, b"ABCDEF"))
```

## Solution

```python
class TcpReassembler:
    def __init__(self, isn=0):
        self.next_seq = isn
        self.buffer = {}
        self.ready = bytearray()

    def push(self, seq, payload):
        for offset, b in enumerate(payload):
            pos = seq + offset
            if pos >= self.next_seq:
                self.buffer.setdefault(pos, b)
        while self.next_seq in self.buffer:
            self.ready.append(self.buffer.pop(self.next_seq))
            self.next_seq += 1
        return self.next_seq

    def read(self):
        out = bytes(self.ready)
        self.ready.clear()
        return out

    def ack(self):
        return self.next_seq
```

## Restored

Out-of-order and overlapping TCP segments now reassemble into an exact contiguous byte stream.
