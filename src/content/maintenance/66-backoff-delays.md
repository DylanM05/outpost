---
id: maintenance-backoff-delays
title: Retry policy and backoff
system: Client desk
symbol: instrument
scene: tests
skills: http
reviewSkill: http
prerequisite: retry-the-wire
---

## Briefing

Retrying a `400 Bad Request` wastes bandwidth, while hammering a `503` without backoff makes an outage worse. Implement the client's retry rules.

## Objective

Write two functions:

1. `should_retry(status)` — returns `True` for `429` (rate limited) or any `5xx` status (`500 <= status <= 599`), and `False` otherwise.
2. `backoff_schedule(retries, base=0.5, cap=8.0)` — returns a list of `retries` wait times where attempt `i` (starting at `0`) waits `min(cap, base * (2 ** i))`.

```python
should_retry(503)               # True
should_retry(404)               # False
backoff_schedule(5, 0.5, 4.0)   # [0.5, 1.0, 2.0, 4.0, 4.0]
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `status == 429 or 500 <= status <= 599`.
2. Use a list comprehension `[min(cap, base * (2 ** i)) for i in range(retries)]`.

## Starter

```python
```

## Checks

```python
expect("should_retry(429)", lambda: get("should_retry")(429), True)
expect("should_retry(503)", lambda: get("should_retry")(503), True)
expect("should_retry(400)", lambda: get("should_retry")(400), False)
expect("backoff_schedule(5, 0.5, 4.0)", lambda: get("backoff_schedule")(5, 0.5, 4.0), [0.5, 1.0, 2.0, 4.0, 4.0])
```

## Hidden checks

```python
expect("should_retry(200)", lambda: get("should_retry")(200), False)
expect("should_retry(500)", lambda: get("should_retry")(500), True)
expect("backoff_schedule(0)", lambda: get("backoff_schedule")(0), [])
```

## Solution

```python
def should_retry(status):
    return status == 429 or 500 <= status <= 599


def backoff_schedule(retries, base=0.5, cap=8.0):
    return [min(cap, base * (2 ** i)) for i in range(retries)]
```

## Restored

The client backs off cleanly on transient faults and fails fast on client errors.
