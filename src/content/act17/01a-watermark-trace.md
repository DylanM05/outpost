---
id: watermark-trace
kind: predict
title: Track watermarks and late events in a stream
system: Window desk
symbol: instrument
scene: console
skills: stream-processing, reading-code
---

## Briefing

Sensors sometimes lose signal and upload readings 20 seconds late. Stream engines track a **watermark** (`max_seen_event_ts - allowed_lateness`): once the watermark crosses a window's end, that window closes and any event older than the watermark is dropped as too late.

## Objective

Trace the event-time watermark loop below and predict **every line it prints**.

## Concept

Watch how `watermark` only moves **forward** (`max(watermark, ts - lateness)`):
- `ts=10` -> `watermark = max(0, 10 - 5) = 5` (accepted)
- `ts=12` -> `watermark = max(5, 12 - 5) = 7` (accepted)
- `ts=6` -> `6 < watermark (7)` -> **late, dropped!**
- `ts=20` -> `watermark = max(7, 20 - 5) = 15` (accepted)
- `ts=15` -> `15 >= watermark (15)` -> **accepted!** (strictly `< watermark` is late)

## Hints

1. Check each event against the *current* watermark before updating the watermark.
2. Only `ts=6` is strictly less than the current watermark (`7`) when it arrives.

## Program

```python
events = [(10, "a"), (12, "b"), (6, "c"), (20, "d"), (15, "e")]
lateness = 5
watermark = 0
accepted = []
dropped = []

for ts, label in events:
    if ts < watermark:
        dropped.append(label)
        continue
    accepted.append(label)
    watermark = max(watermark, ts - lateness)

print(accepted)
print(dropped)
print(watermark)
```

## Output

```text
['a', 'b', 'd', 'e']
['c']
15
```

## Restored

You can trace monotonic event-time watermarks and tell exactly which late readings make the cutoff.
