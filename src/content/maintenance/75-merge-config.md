---
id: maintenance-merge-config
title: Layer configuration with precedence
system: Control panel
symbol: instrument
scene: tests
skills: config
reviewSkill: config
prerequisite: scrub-the-secrets
---

## Briefing

Every service loads settings from three layers: baked-in defaults, a config file, and environment overrides (which always win). Missing required secrets must fail fast at boot.

## Objective

Write `resolve_config(defaults, file_cfg, env_cfg, required=())`:

- Merge layers in precedence order: `defaults` < `file_cfg` < `env_cfg`.
- Ignore keys whose value is `None` in `file_cfg` or `env_cfg` (so an unset env var does not clobber a lower layer).
- If any key in `required` is missing or empty (`None` or `""`), raise `ValueError` mentioning the missing key name(s).
- Return the merged dict without mutating any input dict.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Start with `merged = dict(defaults)`, then loop over `(file_cfg, env_cfg)` updating `merged[k] = v` whenever `v is not None`.
2. Check `[k for k in required if merged.get(k) in (None, "")]` and raise `ValueError` if non-empty.

## Starter

```python
```

## Checks

```python
expect(
    "env overrides file overrides defaults, ignoring None",
    lambda: get("resolve_config")(
        {"port": 8080, "host": "127.0.0.1", "log": "info"},
        {"port": 9000, "log": None},
        {"host": "0.0.0.0", "port": None},
        required=("port", "host"),
    ),
    {"port": 9000, "host": "0.0.0.0", "log": "info"},
)
def missing_req():
    try:
        get("resolve_config")({"port": 8080}, {}, {"api_key": ""}, required=("api_key",))
        return False
    except ValueError as exc:
        return "api_key" in str(exc)
check("missing or blank required key raises ValueError naming it", missing_req)
```

## Hidden checks

```python
d = {"a": 1}
get("resolve_config")(d, {"a": 2}, {"b": 3})
expect("defaults dict is not mutated", lambda: d, {"a": 1})
expect("falsey non-empty values like 0 or False satisfy required", lambda: get("resolve_config")({}, {}, {"retries": 0}, required=("retries",)), {"retries": 0})
```

## Solution

```python
def resolve_config(defaults, file_cfg, env_cfg, required=()):
    merged = dict(defaults)
    for layer in (file_cfg, env_cfg):
        for key, value in layer.items():
            if value is not None:
                merged[key] = value
    missing = [k for k in required if merged.get(k) in (None, "")]
    if missing:
        raise ValueError(f"missing required config: {', '.join(missing)}")
    return merged
```

## Restored

Settings layer predictably from defaults to files to environment, and missing secrets stop the service before it serves a single request.
