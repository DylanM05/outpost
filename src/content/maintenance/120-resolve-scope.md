---
id: maintenance-resolve-scope
title: Resolve variables across lexical frames
system: Parser table
symbol: equipment
scene: tests
skills: parsing
reviewSkill: parsing
prerequisite: lexical-closures
---

## Briefing

When a nested block shadows an outer variable — even setting it to `None` or `0` — lexical lookup must find the innermost binding and stop, raising `NameError` only if no enclosing frame defines the name.

## Objective

Write `lookup_scope(frames, name)` where `frames` is a list of scope dicts ordered **outermost to innermost** (so `frames[0]` is global scope and `frames[-1]` is the innermost local scope).

Search from innermost to outermost and return the bound value of `name` in the first frame where `name in frame`. If `name` does not exist in any frame, raise `NameError`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Iterate `for frame in reversed(frames):` and test `if name in frame:` (never `if frame.get(name):`, which breaks on `0`, `False`, `""`, or `None`!).
2. After the loop finishes without a match, raise `NameError(f"undefined variable: {name}")`.

## Starter

```python
```

## Checks

```python
expect("inner frame shadows outer frame", lambda: get("lookup_scope")([{"x": 1, "y": 2}, {"x": 99}], "x"), 99)
expect("falls through to outer frame", lambda: get("lookup_scope")([{"x": 1, "y": 2}, {"x": 99}], "y"), 2)
expect("inner None shadows outer value", lambda: get("lookup_scope")([{"x": 1}, {"x": None}], "x"), None)
```

## Hidden checks

```python
def _missing():
    try:
        get("lookup_scope")([{"a": 1}, {"b": 2}], "c")
        return False
    except NameError:
        return True
expect("missing variable raises NameError", _missing, True)
expect("inner falsy zero shadows outer value", lambda: get("lookup_scope")([{"n": 5}, {"n": 0}], "n"), 0)
```

## Solution

```python
def lookup_scope(frames, name):
    for frame in reversed(frames):
        if name in frame:
            return frame[name]
    raise NameError(f"undefined variable: {name}")
```

## Restored

Lexical scope resolution respects shadowing even for `None` and `0` bindings.
