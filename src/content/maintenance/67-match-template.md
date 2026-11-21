---
id: maintenance-match-template
title: Match parameterized routes
system: Route switchboard
symbol: controller
scene: tests
skills: api-design
reviewSkill: api-design
prerequisite: validate-the-body
---

## Briefing

An HTTP router needs to match URL templates like `"/stations/{station_id}/sensors/{sensor}"` against incoming request paths and extract the named parameters.

## Objective

Write `match_path(pattern, path)`. Both `pattern` and `path` are `/`-separated paths (ignore a single trailing `/` if present, except `"/"` itself).
- Segments wrapped in `{name}` match any single non-empty segment and capture `params[name] = segment`.
- Literal segments must match exactly.
- Return the `dict` of captured parameters if the paths match, or `None` if they don't.

```python
match_path("/stations/{id}/sensors/{sensor}", "/stations/KR-1/sensors/temp")
# {"id": "KR-1", "sensor": "temp"}
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Normalize both strings with `s.strip("/").split("/")` (handling `"/"` as `[]`).
2. If the segment counts differ, return `None`. Otherwise zip them and match `{name}` vs literal equality.

## Starter

```python
```

## Checks

```python
expect(
    "extracts multiple parameters",
    lambda: get("match_path")("/stations/{id}/sensors/{sensor}", "/stations/KR-1/sensors/temp"),
    {"id": "KR-1", "sensor": "temp"},
)
expect(
    "mismatched literal returns None",
    lambda: get("match_path")("/stations/{id}", "/relays/KR-1"),
    None,
)
expect(
    "mismatched length returns None",
    lambda: get("match_path")("/stations/{id}", "/stations/KR-1/extra"),
    None,
)
```

## Hidden checks

```python
expect("root path matches root", lambda: get("match_path")("/", "/"), {})
expect("trailing slash tolerated", lambda: get("match_path")("/stations/{id}", "/stations/KR-2/"), {"id": "KR-2"})
```

## Solution

```python
def _parts(p):
    trimmed = p.strip("/")
    return [] if not trimmed else trimmed.split("/")


def match_path(pattern, path):
    pat_parts = _parts(pattern)
    path_parts = _parts(path)
    if len(pat_parts) != len(path_parts):
        return None
    params = {}
    for pat, seg in zip(pat_parts, path_parts):
        if pat.startswith("{") and pat.endswith("}") and len(pat) > 2:
            params[pat[1:-1]] = seg
        elif pat != seg:
            return None
    return params
```

## Restored

Parameterized paths extract station and sensor IDs cleanly and reject mismatched routes.
