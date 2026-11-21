---
id: maintenance-trim-chat-budget
title: Keep the newest contiguous chat turns
system: Token bench
symbol: instrument
scene: tests
skills: tokenization-context
reviewSkill: tokenization-context
prerequisite: chunk-with-overlap
---

## Briefing

Before calling the model, trim older turns so the system prompt plus the kept suffix fit within `budget` tokens without leaving holes in the conversation.

## Objective

Write `trim_turns(system_cost, turns, budget)` where `turns` is a chronological list of `(turn_id, token_cost)` tuples.

- Raise `ValueError` if `system_cost > budget` or `budget < 0`.
- Walk `turns` from newest to oldest, keeping turns while `used + cost <= budget`, and stop immediately (`break`) at the first turn that would exceed `budget`.
- Return the kept `turn_id`s in their original chronological order.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Start with `used = system_cost` and walk `reversed(turns)`; remember to `break`, not `continue`, on overflow.
2. Reverse the collected IDs before returning.

## Starter

```python
```

## Checks

```python
expect("keeps contiguous newest suffix within budget", lambda: get("trim_turns")(5, [("t1", 4), ("t2", 8), ("t3", 3), ("t4", 4)], 15), ["t3", "t4"])
expect("keeps all turns when everything fits", lambda: get("trim_turns")(2, [("a", 3), ("b", 4)], 10), ["a", "b"])
expect("stops instead of skipping over an oversized middle turn", lambda: get("trim_turns")(4, [("old", 1), ("huge", 20), ("new", 3)], 10), ["new"])
```

## Hidden checks

```python
def _over():
    try:
        get("trim_turns")(12, [("a", 1)], 10)
        return False
    except ValueError:
        return True
expect("system_cost exceeding budget raises ValueError", _over, True)
expect("empty turns returns empty list", lambda: get("trim_turns")(4, [], 10), [])
```

## Solution

```python
def trim_turns(system_cost, turns, budget):
    if budget < 0 or system_cost > budget:
        raise ValueError("system_cost exceeds budget")
    used = system_cost
    kept = []
    for turn_id, cost in reversed(turns):
        if used + cost > budget:
            break
        kept.append(turn_id)
        used += cost
    kept.reverse()
    return kept
```

## Restored

Chat history stays strictly within budget while keeping recent turns intact and chronological.
