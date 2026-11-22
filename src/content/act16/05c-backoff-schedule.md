---
id: backoff-schedule
title: Schedule exponential backoff with full jitter
system: Load director
symbol: controller
scene: tests
skills: traffic-engineering
---

## Briefing

When a server restarts, a thousand clients retrying at the exact same `1s, 2s, 4s, 8s` intervals create synchronized **thundering herds** that knock it right back down. **Capped exponential backoff with full jitter** spreads retries evenly across `[0, cap]`.

## Concept

For attempt `k` (`0`-based: `0, 1, 2, ...`):
1. Compute uncapped exponential ceiling `raw = base * (2 ** k)`.
2. Cap it: `ceiling = min(max_delay, raw)`.
3. Apply **full jitter** using an injected `rand_fn()` returning a float in `[0.0, 1.0]`:
   `delay = ceiling * rand_fn()`.

Injecting `rand_fn` keeps production randomized (`random.random`) while making unit tests 100% deterministic!

## Objective

Write `retry_delays(attempts, base, max_delay, rand_fn)` returning a list of `attempts` floats:
- Validate `attempts >= 0`, `base > 0`, `max_delay >= base` (else `ValueError`).
- For each `k` from `0` to `attempts - 1`, compute `min(max_delay, base * (2 ** k)) * rand_fn()`.

## Hints

1. Call `rand_fn()` exactly once per attempt in order `k = 0, 1, ..., attempts - 1`.
2. Return `[]` when `attempts == 0`.

## Starter: guided

```python
def retry_delays(attempts, base, max_delay, rand_fn):
    if attempts < 0 or base <= 0 or max_delay < base:
        raise ValueError("invalid backoff parameters")
    delays = []
    for k in range(attempts):
        # Compute capped ceiling and multiply by rand_fn()
        pass
    return delays
```

## Starter: standard

```python
def retry_delays(attempts, base, max_delay, rand_fn):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "applies capped exponential full jitter deterministically",
    lambda: get("retry_delays")(5, 1.0, 6.0, lambda: 0.5),
    [0.5, 1.0, 2.0, 3.0, 3.0],
)
def _seq_rng():
    vals = iter([0.25, 0.75, 1.0])
    return get("retry_delays")(3, 2.0, 10.0, lambda: next(vals))
expect("calls rand_fn once per attempt in order", _seq_rng, [0.5, 3.0, 8.0])
```

## Hidden checks

```python
expect("zero attempts returns empty list", lambda: get("retry_delays")(0, 1.0, 5.0, lambda: 0.5), [])
def _bad():
    for args in [(-1, 1.0, 5.0), (2, 0.0, 5.0), (2, 5.0, 2.0)]:
        try:
            get("retry_delays")(*args, lambda: 0.5)
            return False
        except ValueError:
            pass
    return True
expect("invalid parameters raise ValueError", _bad, True)
```

## Solution

```python
def retry_delays(attempts, base, max_delay, rand_fn):
    if attempts < 0 or base <= 0 or max_delay < base:
        raise ValueError("invalid backoff parameters")
    return [min(max_delay, base * (2 ** k)) * rand_fn() for k in range(attempts)]
```

## Restored

Retry schedules now cap exponential growth and scatter clients with full jitter to prevent thundering herds.
