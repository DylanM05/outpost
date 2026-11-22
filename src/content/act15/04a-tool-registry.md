---
id: tool-registry
title: Validate tool schemas before dispatch
system: Tool bus
symbol: equipment
scene: tests
skills: agent-loops
---

## Briefing

An AI agent invokes Python tools by outputting JSON arguments — and models sometimes pass a string `"42"` where an integer is required, omit a required field, or pass `True` where an integer is expected. Build a strict `ToolRegistry` that validates arguments before calling any handler.

## Concept

Each tool is registered with a `schema` dict mapping parameter names to expected type names (`"str"`, `"int"`, `"float"`, `"bool"`, `"list"`, `"dict"`), plus an optional list of `required` parameter names.

Watch out for Python's classic type trap: `isinstance(True, int)` is `True` because `bool` subclasses `int`!
- When a schema asks for `"int"`, accept `int` ONLY if `not isinstance(val, bool)`.
- When a schema asks for `"float"`, accept `(int, float)` ONLY if `not isinstance(val, bool)`.
- Reject unknown arguments not present in `schema` so typos don't silently get ignored!

## Objective

Implement `ToolRegistry` with:
- `register(self, name, schema, handler, required=None)` — stores the tool (`required` defaults to all keys of `schema` when `None`).
- `call(self, name, args)`:
  - If `name` is unknown -> return `{"ok": False, "error": f"unknown tool: {name}"}`.
  - If `args` is not a `dict` -> return `{"ok": False, "error": "args must be a dict"}`.
  - Check missing required keys, unknown extra keys, and type mismatches against `schema`. On any validation error, return `{"ok": False, "error": "<descriptive message>"}` without calling `handler`.
  - Otherwise invoke `handler(args)` and return `{"ok": True, "result": value}` (if `handler` raises an exception, catch it and return `{"ok": False, "error": str(exc)}`).

## Hints

1. Write a helper `_matches_type(value, type_name)` handling `"bool"` first and rejecting `bool` for `"int"` and `"float"`.
2. When `required is None`, treat every parameter in `schema` as required (`set(schema.keys())`).

## Starter: guided

```python
def _matches_type(value, expected):
    if expected == "bool":
        return isinstance(value, bool)
    if expected == "int":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "float":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    mapping = {"str": str, "list": list, "dict": dict}
    return isinstance(value, mapping[expected]) if expected in mapping else False


class ToolRegistry:
    def __init__(self):
        self.tools = {}

    def register(self, name, schema, handler, required=None):
        req = set(schema.keys()) if required is None else set(required)
        self.tools[name] = (dict(schema), req, handler)

    def call(self, name, args):
        if name not in self.tools:
            return {"ok": False, "error": f"unknown tool: {name}"}
        # Validate args is a dict, required keys exist, no extra keys, and every value matches its type
        return {"ok": False, "error": "not implemented"}
```

## Starter: standard

```python
class ToolRegistry:
    def __init__(self):
        pass

    def register(self, name, schema, handler, required=None):
        pass

    def call(self, name, args):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _happy():
    reg = get("ToolRegistry")()
    reg.register("read_sensor", {"id": "str", "samples": "int"}, lambda a: f"{a['id']}:{a['samples']}")
    return reg.call("read_sensor", {"id": "temp-1", "samples": 3})
expect("validates and invokes matching tool", _happy, {"ok": True, "result": "temp-1:3"})

def _bool_trap():
    reg = get("ToolRegistry")()
    reg.register("set_limit", {"max_watts": "int"}, lambda a: a["max_watts"])
    return reg.call("set_limit", {"max_watts": True})["ok"]
expect("rejects bool when int is required", _bool_trap, False)

def _missing_and_extra():
    reg = get("ToolRegistry")()
    reg.register("ping", {"host": "str", "timeout": "float"}, lambda a: a, required=["host"])
    ok_opt = reg.call("ping", {"host": "relay"})["ok"]
    bad_miss = reg.call("ping", {})["ok"]
    bad_extra = reg.call("ping", {"host": "relay", "bogus": 1})["ok"]
    return (ok_opt, bad_miss, bad_extra)
expect("handles optional, missing required, and extra fields", _missing_and_extra, (True, False, False))
```

## Hidden checks

```python
def _unknown_and_exc():
    reg = get("ToolRegistry")()
    reg.register("boom", {}, lambda a: 1 / 0)
    r1 = reg.call("nope", {})
    r2 = reg.call("boom", {})
    return (r1["ok"], r2["ok"], "division" in r2["error"])
expect("wraps unknown tools and handler exceptions cleanly", _unknown_and_exc, (False, False, True))
```

## Solution

```python
def _matches_type(value, expected):
    if expected == "bool":
        return isinstance(value, bool)
    if expected == "int":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "float":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    mapping = {"str": str, "list": list, "dict": dict}
    return isinstance(value, mapping[expected]) if expected in mapping else False


class ToolRegistry:
    def __init__(self):
        self.tools = {}

    def register(self, name, schema, handler, required=None):
        req = set(schema.keys()) if required is None else set(required)
        self.tools[name] = (dict(schema), req, handler)

    def call(self, name, args):
        if name not in self.tools:
            return {"ok": False, "error": f"unknown tool: {name}"}
        if not isinstance(args, dict):
            return {"ok": False, "error": "args must be a dict"}
        schema, req, handler = self.tools[name]
        for key in req:
            if key not in args:
                return {"ok": False, "error": f"missing required argument: {key}"}
        for key, value in args.items():
            if key not in schema:
                return {"ok": False, "error": f"unexpected argument: {key}"}
            if not _matches_type(value, schema[key]):
                return {"ok": False, "error": f"argument {key} must be {schema[key]}"}
        try:
            return {"ok": True, "result": handler(args)}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}
```

## Restored

Tool dispatch now validates schemas strictly and turns bad arguments or runtime errors into clean structured feedback for the agent.
