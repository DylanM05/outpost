---
id: maintenance-error-budget
title: Server error rate and SLO check
system: Telemetry bus
symbol: instrument
scene: tests
skills: observability
reviewSkill: observability
prerequisite: latency-and-errors
---

## Briefing

Client errors (`4xx`) usually come from callers, while server errors (`5xx`) burn your service's error budget. Compute the `5xx` error rate and check whether the SLO threshold is breached.

## Objective

Write two functions:

1. `server_error_rate(statuses)` — given a list of integer HTTP status codes, return the fraction that are `5xx` (`500 <= code <= 599`), or `0.0` if `statuses` is empty.
2. `slo_breached(statuses, max_rate)` — return `True` if `server_error_rate(statuses) > max_rate`, else `False`.

```python
server_error_rate([200, 404, 500, 503])  # 0.5
slo_breached([200, 200, 500], 0.1)       # True
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Guard empty input first (`if not statuses: return 0.0`).
2. Count `sum(1 for s in statuses if 500 <= s <= 599) / len(statuses)`. Notice `404` and `429` are *not* `5xx`.

## Starter

```python
```

## Checks

```python
expect("ignores 4xx, counts 5xx", lambda: get("server_error_rate")([200, 404, 500, 503]), 0.5)
expect("empty list returns 0.0", lambda: get("server_error_rate")([]), 0.0)
expect("breaches when strictly above max_rate", lambda: get("slo_breached")([200, 200, 500], 0.1), True)
```

## Hidden checks

```python
expect("exact threshold is not breached", lambda: get("slo_breached")([200, 500], 0.5), False)
expect("all 4xx is 0.0 server error rate", lambda: get("server_error_rate")([400, 401, 403, 404]), 0.0)
```

## Solution

```python
def server_error_rate(statuses):
    if not statuses:
        return 0.0
    errors = sum(1 for code in statuses if 500 <= code <= 599)
    return errors / len(statuses)


def slo_breached(statuses, max_rate):
    return server_error_rate(statuses) > max_rate
```

## Restored

Alerts now page on real `5xx` outages without crying wolf over client `404` typos.
