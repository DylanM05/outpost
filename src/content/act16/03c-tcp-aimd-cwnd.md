---
id: tcp-aimd-cwnd
title: Model TCP slow start and AIMD congestion control
system: Stream window
symbol: controller
scene: tests
skills: transport-protocols
---

## Briefing

If every sender blasted packets at full link speed, routers would drop everything in a congestion collapse. TCP probes available bandwidth gently using **Slow Start** (exponential doubling per RTT up to `ssthresh`), **Congestion Avoidance** (+1 MSS per RTT above `ssthresh`), and **Multiplicative Decrease** when a loss happens.

## Concept

Track two positive integers (measured in MSS segments): `cwnd` (starts at `1`) and `ssthresh` (initial slow-start threshold, e.g. `16`).
Simulate a list of RTT events:
- `"ack"` (full RTT acknowledged cleanly):
  - If `cwnd < ssthresh`: **Slow Start** — double `cwnd` (`cwnd = min(cwnd * 2, ssthresh)`? Actually classic TCP Reno doubles `cwnd *= 2` while `cwnd < ssthresh`, and once `cwnd >= ssthresh` adds `1`! Let's specify exact rule clearly: if `cwnd < ssthresh`, `cwnd = min(cwnd * 2, ssthresh)` or `cwnd *= 2` — wait: classic textbook RFC 5681: if `cwnd < ssthresh`: `cwnd *= 2`, else: `cwnd += 1`. That's crystal clear and unambiguous!).
- `"fast_retransmit"` (3 duplicate ACKs — mild loss):
  - `ssthresh = max(2, cwnd // 2)`
  - `cwnd = ssthresh`
- `"timeout"` (severe loss — RTO expired):
  - `ssthresh = max(2, cwnd // 2)`
  - `cwnd = 1`

## Objective

Write `simulate_cwnd(events, ssthresh=16)` starting at `cwnd = 1` and applying each event in `events` (`"ack"`, `"fast_retransmit"`, `"timeout"`, raising `ValueError` on unknown events).

Return `{"cwnd": cwnd, "ssthresh": ssthresh, "history": history}` where `history` is the list of `cwnd` values after each event.

## Hints

1. Check `if cwnd < ssthresh: cwnd *= 2` else `cwnd += 1` on `"ack"`.
2. On `"fast_retransmit"`, set `ssthresh = max(2, cwnd // 2)` and `cwnd = ssthresh`. On `"timeout"`, set `ssthresh = max(2, cwnd // 2)` and `cwnd = 1`.

## Starter: guided

```python
def simulate_cwnd(events, ssthresh=16):
    cwnd = 1
    history = []
    for event in events:
        if event == "ack":
            # Slow start if cwnd < ssthresh, else congestion avoidance (+1)
            pass
        elif event == "fast_retransmit":
            pass
        elif event == "timeout":
            pass
        else:
            raise ValueError(f"unknown event: {event}")
        history.append(cwnd)
    return {"cwnd": cwnd, "ssthresh": ssthresh, "history": history}
```

## Starter: standard

```python
def simulate_cwnd(events, ssthresh=16):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "slow start doubles then transitions to linear growth",
    lambda: get("simulate_cwnd")(["ack", "ack", "ack", "ack", "ack"], ssthresh=8),
    {"cwnd": 10, "ssthresh": 8, "history": [2, 4, 8, 9, 10]},
)
expect(
    "fast_retransmit halves cwnd and timeout resets cwnd to 1",
    lambda: get("simulate_cwnd")(["ack", "ack", "ack", "fast_retransmit", "ack", "timeout", "ack"], ssthresh=16),
    {"cwnd": 2, "ssthresh": 2, "history": [2, 4, 8, 4, 5, 1, 2]},
)
```

## Hidden checks

```python
expect("empty events returns initial state", lambda: get("simulate_cwnd")([], ssthresh=12), {"cwnd": 1, "ssthresh": 12, "history": []})
def _bad():
    try:
        get("simulate_cwnd")(["bogus"])
        return False
    except ValueError:
        return True
expect("unknown event raises ValueError", _bad, True)
```

## Solution

```python
def simulate_cwnd(events, ssthresh=16):
    cwnd = 1
    history = []
    for event in events:
        if event == "ack":
            if cwnd < ssthresh:
                cwnd *= 2
            else:
                cwnd += 1
        elif event == "fast_retransmit":
            ssthresh = max(2, cwnd // 2)
            cwnd = ssthresh
        elif event == "timeout":
            ssthresh = max(2, cwnd // 2)
            cwnd = 1
        else:
            raise ValueError(f"unknown event: {event}")
        history.append(cwnd)
    return {"cwnd": cwnd, "ssthresh": ssthresh, "history": history}
```

## Restored

Congestion control probes link capacity cleanly and backs off smoothly under packet loss.
