---
id: maintenance-fix-breaker-halfopen
title: Fix a half-open circuit breaker probe stampede
system: Load director
symbol: controller
scene: tests
skills: traffic-engineering
reviewSkill: traffic-engineering
prerequisite: backoff-schedule
---

## Briefing

When the circuit breaker exits cooldown into `"half_open"`, the buggy implementation in the editor allows EVERY waiting request through at once instead of gating on a single probe! Patch it so only one probe runs at a time.

## Objective

Fix `HalfOpenGate` in the editor so that:
- `enter()` returns `True` when `state == "closed"`.
- When `state == "half_open"`, `enter()` returns `True` ONLY if no probe is currently in flight (and marks a probe as in flight so subsequent `enter()` calls return `False` until `succeed()` or `fail()` is called!).
- `enter()` returns `False` when `state == "open"`.
- `succeed()` sets `state = "closed"` and clears the in-flight probe flag.
- `fail()` sets `state = "open"` and clears the in-flight probe flag.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Add `self.probing = False` in `__init__`.
2. In `enter()`, for `"half_open"`, return `False` if `self.probing` is already `True`; otherwise set `self.probing = True` and return `True`. Clear `self.probing = False` in both `succeed()` and `fail()`.

## Starter

```python
class HalfOpenGate:
    def __init__(self, state="half_open"):
        self.state = state

    def enter(self):
        return self.state in ("closed", "half_open")

    def succeed(self):
        self.state = "closed"

    def fail(self):
        self.state = "open"
```

## Checks

```python
def _single_probe():
    g = get("HalfOpenGate")("half_open")
    r1 = g.enter()
    r2 = g.enter()
    g.succeed()
    r3 = g.enter()
    r4 = g.enter()
    return (r1, r2, g.state, r3, r4)
expect("allows exactly one half-open probe then opens floodgates on success", _single_probe, (True, False, "closed", True, True))

def _fail_reopen():
    g = get("HalfOpenGate")("half_open")
    p = g.enter()
    g.fail()
    return (p, g.state, g.enter())
expect("failed probe transitions to open and blocks further entries", _fail_reopen, (True, "open", False))
```

## Hidden checks

```python
def _open_state():
    g = get("HalfOpenGate")("open")
    return g.enter()
expect("open gate blocks entry immediately", _open_state, False)
```

## Solution

```python
class HalfOpenGate:
    def __init__(self, state="half_open"):
        self.state = state
        self.probing = False

    def enter(self):
        if self.state == "closed":
            return True
        if self.state == "half_open" and not self.probing:
            self.probing = True
            return True
        return False

    def succeed(self):
        self.state = "closed"
        self.probing = False

    def fail(self):
        self.state = "open"
        self.probing = False
```

## Restored

Half-open recovery now sends a single careful probe instead of stampeding a recovering backend.
