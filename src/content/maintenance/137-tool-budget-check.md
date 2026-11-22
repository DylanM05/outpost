---
id: maintenance-tool-budget-check
title: Enforce per-tool call budgets
system: Tool bus
symbol: equipment
scene: tests
skills: agent-loops
reviewSkill: agent-loops
prerequisite: eval-harness
---

## Briefing

Expensive tools like `run_full_scan` should only be allowed once or twice per session even if cheap tools like `read_sensor` have no cap. Check a session's call log against per-tool limits.

## Objective

Write `within_tool_budget(calls, limits)` where `calls` is a list of tool-name strings executed in a session and `limits` is a dict mapping tool names to maximum allowed call counts (non-negative ints).

Return `True` if every tool's count in `calls` is `<= limits[tool]` (tools absent from `limits` are unlimited); return `False` if any tool exceeds its limit.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Count calls with `collections.Counter(calls)`.
2. Check `all(count <= limits[name] for name, count in counts.items() if name in limits)`.

## Starter

```python
```

## Checks

```python
expect("passes when all limited tools stay within budget", lambda: get("within_tool_budget")(["scan", "read", "read", "read"], {"scan": 1}), True)
expect("fails when a tool exceeds its cap", lambda: get("within_tool_budget")(["scan", "scan"], {"scan": 1}), False)
expect("zero cap blocks any call to that tool", lambda: get("within_tool_budget")(["reboot"], {"reboot": 0}), False)
```

## Hidden checks

```python
expect("empty calls always passes", lambda: get("within_tool_budget")([], {"reboot": 0}), True)
expect("empty limits allows any calls", lambda: get("within_tool_budget")(["a", "a", "a"], {}), True)
```

## Solution

```python
from collections import Counter


def within_tool_budget(calls, limits):
    counts = Counter(calls)
    for name, count in counts.items():
        if name in limits and count > limits[name]:
            return False
    return True
```

## Restored

Per-tool call limits prevent expensive or forbidden operations from blowing past session caps.
