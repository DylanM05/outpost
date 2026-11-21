---
id: loop-breaker
title: Break runaway identical tool loops
system: Tool bus
symbol: equipment
scene: tests
skills: agent-loops
---

## Briefing

When a tool fails or returns empty results, an agent can get stuck calling the exact same tool with the exact same arguments over and over until `max_steps` burns through your budget. Canonicalize each call signature and trip a circuit breaker before repeating past `max_repeats`.

## Concept

Two argument dicts `{"a": 1, "b": 2}` and `{"b": 2, "a": 1}` are logically identical even if their keys were emitted in different orders! Serializing with `json.dumps({"name": tool_name, "args": args}, sort_keys=True, separators=(",", ":"))` produces one canonical string key for any nested JSON-compatible arguments.

## Objective

Implement two functions:
1. `canonical_call_key(tool_name, args)` — returns `json.dumps({"name": tool_name, "args": args}, sort_keys=True, separators=(",", ":"))`.
2. `is_stuck_call(history, tool_name, args, max_repeats=2)` — where `history` is a list of prior `(prior_name, prior_args)` tuples. Validate `max_repeats >= 1` (else `ValueError`). Return `True` if the exact same canonical call already appears `>= max_repeats` times in `history` (meaning executing it again would exceed the repeat budget!), else `False`.

## Hints

1. Compute `target = canonical_call_key(tool_name, args)` and count how many `(n, a)` pairs in `history` have `canonical_call_key(n, a) == target`.
2. Return `count >= max_repeats`.

## Starter: guided

```python
import json


def canonical_call_key(tool_name, args):
    return json.dumps({"name": tool_name, "args": args}, sort_keys=True, separators=(",", ":"))


def is_stuck_call(history, tool_name, args, max_repeats=2):
    if max_repeats < 1:
        raise ValueError("max_repeats must be >= 1")
    # Count matching canonical keys in history and compare to max_repeats
    return False
```

## Starter: standard

```python
import json


def canonical_call_key(tool_name, args):
    pass


def is_stuck_call(history, tool_name, args, max_repeats=2):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "ignores dict key ordering when canonicalizing",
    lambda: get("canonical_call_key")("search", {"b": 2, "a": 1}) == get("canonical_call_key")("search", {"a": 1, "b": 2}),
    True,
)
expect(
    "allows up to max_repeats calls before tripping",
    lambda: get("is_stuck_call")([("read", {"id": 1})], "read", {"id": 1}, max_repeats=2),
    False,
)
expect(
    "trips once call already occurred max_repeats times",
    lambda: get("is_stuck_call")([("read", {"a": 1, "b": 2}), ("read", {"b": 2, "a": 1})], "read", {"a": 1, "b": 2}, max_repeats=2),
    True,
)
```

## Hidden checks

```python
expect(
    "different args do not trip breaker",
    lambda: get("is_stuck_call")([("read", {"id": 1}), ("read", {"id": 2})], "read", {"id": 3}, max_repeats=2),
    False,
)
def _bad():
    try:
        get("is_stuck_call")([], "read", {}, max_repeats=0)
        return False
    except ValueError:
        return True
expect("max_repeats < 1 raises ValueError", _bad, True)
```

## Solution

```python
import json


def canonical_call_key(tool_name, args):
    return json.dumps({"name": tool_name, "args": args}, sort_keys=True, separators=(",", ":"))


def is_stuck_call(history, tool_name, args, max_repeats=2):
    if max_repeats < 1:
        raise ValueError("max_repeats must be >= 1")
    target = canonical_call_key(tool_name, args)
    seen = sum(1 for name, prior_args in history if canonical_call_key(name, prior_args) == target)
    return seen >= max_repeats
```

## Restored

Runaway duplicate tool calls are caught deterministically regardless of JSON key ordering.
