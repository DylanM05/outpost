---
id: maintenance-parse-bool-env
title: Parse boolean env flags
system: Control panel
symbol: instrument
scene: tests
skills: config
reviewSkill: config
prerequisite: scrub-the-secrets
---

## Briefing

In Python, `bool("false")` is `True` — a classic production config bug that turns debug mode on when someone sets `DEBUG=false`. Write a strict environment-variable boolean parser.

## Objective

Write `env_bool(env, key, default=False)`:

- If `key` is not in `env`, return `default`.
- Strip whitespace and lowercase the string value:
  - `"1"`, `"true"`, `"yes"`, `"on"` -> return `True`
  - `"0"`, `"false"`, `"no"`, `"off"` -> return `False`
  - Anything else -> raise `ValueError`.

```python
env_bool({"DEBUG": "false"}, "DEBUG")  # False
env_bool({"DEBUG": "YES"}, "DEBUG")    # True
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `if key not in env: return default` first.
2. Normalize `val = str(env[key]).strip().lower()` and match against explicit true/false sets, raising `ValueError` otherwise.

## Starter

```python
```

## Checks

```python
expect("DEBUG='false' is False", lambda: get("env_bool")({"DEBUG": "false"}, "DEBUG"), False)
expect("DEBUG=' YES ' is True", lambda: get("env_bool")({"DEBUG": " YES "}, "DEBUG"), True)
expect("missing key uses default", lambda: get("env_bool")({}, "TLS", True), True)
```

## Hidden checks

```python
expect("'0' is False", lambda: get("env_bool")({"A": "0"}, "A"), False)
expect("'on' is True", lambda: get("env_bool")({"A": "on"}, "A"), True)
def bad_raises():
    try:
        get("env_bool")({"A": "maybe"}, "A")
        return False
    except ValueError:
        return True
check("invalid value raises ValueError", bad_raises)
```

## Solution

```python
TRUTHY = {"1", "true", "yes", "on"}
FALSY = {"0", "false", "no", "off"}


def env_bool(env, key, default=False):
    if key not in env:
        return default
    raw = str(env[key]).strip().lower()
    if raw in TRUTHY:
        return True
    if raw in FALSY:
        return False
    raise ValueError(f"invalid boolean for {key}: {env[key]!r}")
```

## Restored

`DEBUG=false` stays off, and typos fail fast at boot instead of silently enabling flags.
