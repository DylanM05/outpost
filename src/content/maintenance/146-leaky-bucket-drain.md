---
id: maintenance-leaky-bucket-drain
title: Simulate a leaky-bucket traffic shaper
system: Gateway router
symbol: equipment
scene: tests
skills: traffic-engineering
reviewSkill: traffic-engineering
prerequisite: backoff-schedule
---

## Briefing

Unlike a token bucket (which permits bursts up to capacity), a **leaky bucket** drains queued work at a steady constant rate and drops any incoming packet that would overflow the queue.

## Objective

Write `leaky_bucket_step(queued, drain_rate, elapsed, incoming, capacity)`:
- Drain the queue first: `after_drain = max(0.0, queued - drain_rate * max(0.0, elapsed))`.
- If `after_drain + incoming <= capacity`: return `(True, after_drain + incoming)`.
- Otherwise reject the incoming packet without adding it: return `(False, after_drain)`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Always compute `after_drain = max(0.0, queued - drain_rate * max(0.0, elapsed))` first so the queue reflects drained work even when the new packet is rejected.
2. Check `after_drain + incoming <= capacity`.

## Starter

```python
```

## Checks

```python
expect("drains queue then accepts packet within capacity", lambda: get("leaky_bucket_step")(4.0, 1.5, 2.0, 3.0, 5.0), (True, 4.0))
expect("drops overflowing packet while keeping drained level", lambda: get("leaky_bucket_step")(4.0, 1.0, 1.0, 3.0, 5.0), (False, 3.0))
```

## Hidden checks

```python
expect("never drains below zero", lambda: get("leaky_bucket_step")(2.0, 5.0, 10.0, 1.0, 5.0), (True, 1.0))
```

## Solution

```python
def leaky_bucket_step(queued, drain_rate, elapsed, incoming, capacity):
    after_drain = max(0.0, queued - drain_rate * max(0.0, elapsed))
    if after_drain + incoming <= capacity:
        return (True, after_drain + incoming)
    return (False, after_drain)
```

## Restored

Leaky-bucket pacing smooths outbound packets to a constant steady flow without queue overflow.
