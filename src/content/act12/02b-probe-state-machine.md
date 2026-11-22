---
id: probe-state-machine
kind: code
title: Hysteresis readiness probes
system: Rollout bay
symbol: equipment
scene: tests
skills: orchestration
---

## Briefing

If a readiness probe pulls a pod out of the load balancer on a single 100ms network blip — or puts a crash-looping pod back in rotation after one lucky ping — traffic flaps wildly. Kubernetes avoids flapping with **threshold hysteresis**: `failure_threshold` consecutive failures to mark NotReady, and `success_threshold` consecutive successes to mark Ready.

## Objective

Write a class `ProbeMonitor`:

- `__init__(self, failure_threshold=3, success_threshold=2, initial_ready=False)`:
  - Validate both thresholds `>= 1` (raise `ValueError` otherwise).
  - Track `self.ready = initial_ready`, consecutive passes, and consecutive failures.
- `record(self, ok: bool) -> bool`:
  - If `ok` is `True`: reset consecutive failures to `0`, increment consecutive passes; if `not self.ready` and `passes >= success_threshold`, set `self.ready = True`.
  - If `ok` is `False`: reset consecutive passes to `0`, increment consecutive failures; if `self.ready` and `failures >= failure_threshold`, set `self.ready = False`.
  - Return the current `self.ready` boolean.

## Concept

Hysteresis is one of the highest-leverage stability tricks in systems engineering: requiring consecutive evidence before flipping state prevents oscillation ("flapping") during noisy conditions while still reacting quickly to genuine crashes.

## Hints

1. Keep `self._ok_streak = 0` and `self._fail_streak = 0`.
2. Reset the opposite streak to `0` on every `record(ok)` call!

## Starter: guided

```python
class ProbeMonitor:
    def __init__(self, failure_threshold=3, success_threshold=2, initial_ready=False):
        if failure_threshold < 1 or success_threshold < 1:
            raise ValueError("thresholds must be >= 1")
        self.failure_threshold = failure_threshold
        self.success_threshold = success_threshold
        self.ready = initial_ready
        self._ok_streak = 0
        self._fail_streak = 0

    def record(self, ok):
        # TODO: update streaks and flip self.ready only when thresholds are met
        return self.ready
```

## Starter: standard

```python
class ProbeMonitor:
    def __init__(self, failure_threshold=3, success_threshold=2, initial_ready=False):
        pass

    def record(self, ok):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
PM = get("ProbeMonitor")
def trace_probe():
    p = PM(failure_threshold=3, success_threshold=2, initial_ready=False)
    # 1 pass isn't enough; fail resets streak; 2 consecutive passes -> Ready;
    # 2 fails don't drop Ready; 1 pass resets fail streak; 3 fails -> NotReady
    seq = [True, False, True, True, False, False, True, False, False, False]
    return [p.record(x) for x in seq]

expect(
    "follows consecutive success and failure thresholds without flapping",
    trace_probe,
    [False, False, False, True, True, True, True, True, True, False],
)
```

## Hidden checks

```python
PM = get("ProbeMonitor")
def bad_thresh():
    try:
        PM(failure_threshold=0)
        return False
    except ValueError:
        return True
check("threshold < 1 raises ValueError", bad_thresh)
expect("initial_ready=True stays Ready on single blip", lambda: PM(2, 1, True).record(False), True)
```

## Solution

```python
class ProbeMonitor:
    def __init__(self, failure_threshold=3, success_threshold=2, initial_ready=False):
        if failure_threshold < 1 or success_threshold < 1:
            raise ValueError("thresholds must be >= 1")
        self.failure_threshold = failure_threshold
        self.success_threshold = success_threshold
        self.ready = initial_ready
        self._ok_streak = 0
        self._fail_streak = 0

    def record(self, ok):
        if ok:
            self._fail_streak = 0
            self._ok_streak += 1
            if not self.ready and self._ok_streak >= self.success_threshold:
                self.ready = True
        else:
            self._ok_streak = 0
            self._fail_streak += 1
            if self.ready and self._fail_streak >= self.failure_threshold:
                self.ready = False
        return self.ready
```

## Restored

Single blips no longer yank healthy pods from rotation, and genuinely failing pods drain cleanly after three strikes.
