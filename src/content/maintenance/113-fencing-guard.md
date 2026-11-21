---
id: maintenance-fencing-guard
title: Guard storage writes with fencing tokens
system: Quorum vault
symbol: equipment
scene: tests
skills: distributed-systems
reviewSkill: distributed-systems
prerequisite: vector-clocks
---

## Briefing

A paused former leader can wake up after its lease expired and send a late write to the storage server. Monotonic fencing tokens stop stale leaders from corrupting state.

## Objective

Write a `FencedRegister` class with:
- `__init__(self, initial=None)` setting `self.value = initial` and `self.highest_token = 0`.
- `write(self, token, value)`:
  - If `token < self.highest_token`, raise `PermissionError` without changing `self.value` or `self.highest_token`.
  - Otherwise update `self.highest_token = token`, `self.value = value`, and return `value`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Note that a leader holding the *current* token (`token == self.highest_token`) may perform multiple writes; only strictly smaller tokens (`token < self.highest_token`) are stale.
2. Raise `PermissionError` before mutating `self.value`.

## Starter

```python
```

## Checks

```python
def _flow():
    reg = get("FencedRegister")("init")
    reg.write(3, "v1")
    reg.write(3, "v2")
    reg.write(5, "v3")
    return (reg.value, reg.highest_token)
expect("accepts equal and increasing tokens", _flow, ("v3", 5))

def _stale():
    reg = get("FencedRegister")("init")
    reg.write(5, "fresh")
    try:
        reg.write(4, "stale")
        return False
    except PermissionError:
        return (reg.value, reg.highest_token)
expect("rejects stale token and preserves state", _stale, ("fresh", 5))
```

## Hidden checks

```python
def _negative():
    reg = get("FencedRegister")()
    try:
        reg.write(-1, "bad")
        return False
    except PermissionError:
        return reg.value is None
expect("rejects token below initial 0", _negative, True)
```

## Solution

```python
class FencedRegister:
    def __init__(self, initial=None):
        self.value = initial
        self.highest_token = 0

    def write(self, token, value):
        if token < self.highest_token:
            raise PermissionError(f"stale fencing token {token} < {self.highest_token}")
        self.highest_token = token
        self.value = value
        return value
```

## Restored

The storage register rejects delayed writes from deposed leaders using monotonic fencing tokens.
