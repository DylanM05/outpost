---
id: maintenance-zigzag-codec
title: Convert signed integers with Protobuf ZigZag encoding
system: Codec deck
symbol: instrument
scene: tests
skills: protobuf-grpc
reviewSkill: protobuf-grpc
prerequisite: grpc-deadline-router
---

## Briefing

ZigZag maps signed integers with small absolute values (`-1`, `-2`, `1`, `2`) to small non-negative integers so varints pack them in a single byte.

## Objective

Implement `to_zigzag(n)` (mapping `0->0, -1->1, 1->2, -2->3, ...`) and `from_zigzag(u)` (inverse; raise `ValueError` if `u < 0`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. `to_zigzag(n) = 2 * n if n >= 0 else -2 * n - 1`, and `from_zigzag(u) = (u >> 1) ^ -(u & 1)`.

## Starter

```python
```

## Checks

```python
expect("encodes signed sequence cleanly", lambda: [get("to_zigzag")(x) for x in [0, -1, 1, -2, 2]], [0, 1, 2, 3, 4])
expect("decodes unsigned sequence back to signed", lambda: [get("from_zigzag")(u) for u in [0, 1, 2, 3, 4]], [0, -1, 1, -2, 2])
```

## Hidden checks

```python
expect("round-trips large negatives", lambda: get("from_zigzag")(get("to_zigzag")(-987654321)), -987654321)
def _neg():
    try:
        get("from_zigzag")(-1)
        return False
    except ValueError:
        return True
expect("from_zigzag rejects negative input", _neg, True)
```

## Solution

```python
def to_zigzag(n):
    return 2 * n if n >= 0 else -2 * n - 1


def from_zigzag(u):
    if u < 0:
        raise ValueError("u must be non-negative")
    return (u >> 1) ^ -(u & 1)
```

## Restored

ZigZag signed integer encoding keeps negative Protobuf fields compact on the wire.
