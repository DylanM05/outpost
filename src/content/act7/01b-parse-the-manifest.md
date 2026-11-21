---
id: parse-the-manifest
title: Parse the manifest
system: Packet wire
symbol: instrument
scene: tests
skills: http, errors
---

## Briefing

Valley Station broadcasts supply manifests as JSON text over the packet wire. Static can cut a message in half, or an older station can omit a field or send a string where a number belongs. Parse incoming manifests safely and encode outgoing summaries in clean, deterministic JSON.

## Objective

Write two functions:

1. `parse_manifest(raw)`: takes a JSON string representing a shipment object with required fields `"station"` (non-empty `str`) and `"items"` (a `list` of dicts, each having `"sku"` as `str` and `"qty"` as a positive `int`, not a `bool`).
   - Return `(True, data)` if valid, where `data` is the parsed dictionary.
   - Return `(False, reason)` (where `reason` is a non-empty error string) if `raw` is invalid JSON, not a JSON object, or fails any field check above.
2. `encode_summary(station, items)`: takes a station name and a list of `{"sku": ..., "qty": ...}` dicts and returns a compact JSON string (`separators=(",", ":")`, `sort_keys=True`) encoding `{"station": station, "total_qty": <sum of qtys>, "count": <number of items>}`.

```python
parse_manifest('{"station": "Valley", "items": [{"sku": "FUEL", "qty": 4}]}')
# (True, {"station": "Valley", "items": [{"sku": "FUEL", "qty": 4}]})

encode_summary("Valley", [{"sku": "FUEL", "qty": 4}, {"sku": "ROPE", "qty": 2}])
# '{"count":2,"station":"Valley","total_qty":6}'
```

## Concept

Never trust data coming off a network wire:

1. Wrap `json.loads(raw)` in `try ... except json.JSONDecodeError:` so truncated or corrupt text becomes a clean error instead of a crash.
2. Check the decoded structure with `isinstance(...)`. One Python gotcha: `isinstance(True, int)` is `True` because `bool` subclasses `int`! Always guard with `type(qty) is int` (or `isinstance(qty, int) and not isinstance(qty, bool)`).
3. `json.dumps(obj, sort_keys=True, separators=(",", ":"))` removes spaces after commas and colons — compact on slow radio links and identical across machines.

## Hints

1. Catch `(json.JSONDecodeError, TypeError)` around `json.loads(raw)` and return `(False, "invalid json")`.
2. Check `isinstance(data, dict)`, `isinstance(data.get("station"), str) and data["station"] != ""`, and `isinstance(data.get("items"), list)`.
3. For each item in `data["items"]`, check `isinstance(item, dict)`, `isinstance(item.get("sku"), str) and item["sku"] != ""`, and `type(item.get("qty")) is int and item["qty"] > 0`.

## Starter: guided

```python
import json


def parse_manifest(raw):
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return (False, "invalid json")
    if not isinstance(data, dict):
        return (False, "manifest must be an object")
    # Validate "station" (non-empty str) and "items" (list of valid {"sku", "qty"} dicts).
    return (True, data)


def encode_summary(station, items):
    summary = {
        "station": station,
        "count": len(items),
        "total_qty": sum(item["qty"] for item in items),
    }
    # Return compact JSON with sorted keys.
    return ""
```

## Starter: standard

```python
import json


def parse_manifest(raw):
    return (False, "not implemented")


def encode_summary(station, items):
    return ""
```

## Starter: challenge

```python
```

## Checks

```python
valid = '{"station": "Valley", "items": [{"sku": "FUEL", "qty": 4}]}'
expect("valid manifest parses", lambda: get("parse_manifest")(valid), (True, {"station": "Valley", "items": [{"sku": "FUEL", "qty": 4}]}))
expect("broken JSON rejected", lambda: get("parse_manifest")('{"station": ')[0], False)
expect("missing items rejected", lambda: get("parse_manifest")('{"station": "Valley"}')[0], False)
expect("negative qty rejected", lambda: get("parse_manifest")('{"station": "Valley", "items": [{"sku": "A", "qty": -1}]}')[0], False)
expect(
    "encode_summary produces compact sorted JSON",
    lambda: get("encode_summary")("Valley", [{"sku": "FUEL", "qty": 4}, {"sku": "ROPE", "qty": 2}]),
    '{"count":2,"station":"Valley","total_qty":6}',
)
```

## Hidden checks

```python
expect("top-level JSON list rejected", lambda: get("parse_manifest")("[1, 2, 3]")[0], False)
expect("empty station rejected", lambda: get("parse_manifest")('{"station": "", "items": []}')[0], False)
expect("boolean qty rejected (True is not a valid quantity)", lambda: get("parse_manifest")('{"station": "Valley", "items": [{"sku": "A", "qty": true}]}')[0], False, "Remember isinstance(True, int) is True; check `not isinstance(qty, bool)`.")
expect("zero qty rejected", lambda: get("parse_manifest")('{"station": "Valley", "items": [{"sku": "A", "qty": 0}]}')[0], False)
expect("empty items list is valid", lambda: get("parse_manifest")('{"station": "Ridge", "items": []}'), (True, {"station": "Ridge", "items": []}))
expect("encode_summary on empty items", lambda: get("encode_summary")("Ridge", []), '{"count":0,"station":"Ridge","total_qty":0}')
```

## Solution

```python
import json


def parse_manifest(raw):
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return (False, "invalid json")
    if not isinstance(data, dict):
        return (False, "manifest must be an object")
    station = data.get("station")
    items = data.get("items")
    if not isinstance(station, str) or not station:
        return (False, "missing or invalid station")
    if not isinstance(items, list):
        return (False, "items must be a list")
    for item in items:
        if not isinstance(item, dict):
            return (False, "each item must be an object")
        sku = item.get("sku")
        qty = item.get("qty")
        if not isinstance(sku, str) or not sku:
            return (False, "invalid sku")
        if isinstance(qty, bool) or not isinstance(qty, int) or qty <= 0:
            return (False, "qty must be a positive integer")
    return (True, data)


def encode_summary(station, items):
    summary = {
        "station": station,
        "count": len(items),
        "total_qty": sum(item["qty"] for item in items),
    }
    return json.dumps(summary, sort_keys=True, separators=(",", ":"))
```

## Restored

Corrupt packets and malformed quantities are rejected at the wire before they can touch the exchange ledger.
