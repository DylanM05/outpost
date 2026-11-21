---
id: maintenance-parse-tool-json
title: Safely parse structured tool-call JSON
system: Tool bus
symbol: equipment
scene: tests
skills: agent-loops
reviewSkill: agent-loops
prerequisite: eval-harness
---

## Briefing

Models sometimes emit truncated JSON or forget the `"args"` object when requesting a tool call. Parse raw tool-call strings safely and return `None` whenever the payload is malformed instead of crashing the agent loop.

## Objective

Write `parse_tool_call(raw)` where `raw` is a string.

Return `(name, args)` iff `raw` parses as a JSON `dict` containing:
- `"name"`: a non-empty `str` (stripped, non-whitespace)
- `"args"`: a JSON `dict`

For any invalid JSON or malformed structure, return `None`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Catch `(json.JSONDecodeError, TypeError)` around `json.loads(raw)`.
2. Verify `isinstance(obj, dict)`, `isinstance(obj.get("name"), str) and obj["name"].strip()`, and `isinstance(obj.get("args"), dict)`.

## Starter

```python
```

## Checks

```python
expect("parses valid tool-call JSON", lambda: get("parse_tool_call")('{"name": "read_log", "args": {"lines": 10}}'), ("read_log", {"lines": 10}))
expect("returns None on truncated JSON", lambda: get("parse_tool_call")('{"name": "read_log"'), None)
expect("returns None when args is not a dict", lambda: get("parse_tool_call")('{"name": "read_log", "args": [1, 2]}'), None)
```

## Hidden checks

```python
expect("returns None for blank tool name", lambda: get("parse_tool_call")('{"name": "   ", "args": {}}'), None)
expect("returns None for JSON array", lambda: get("parse_tool_call")('["read_log"]'), None)
```

## Solution

```python
import json


def parse_tool_call(raw):
    if not isinstance(raw, str):
        return None
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict):
        return None
    name = data.get("name")
    args = data.get("args")
    if not isinstance(name, str) or not name.strip() or not isinstance(args, dict):
        return None
    return (name.strip(), args)
```

## Restored

Malformed tool JSON now fails cleanly into a recovery turn instead of crashing the runtime.
