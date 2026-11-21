---
id: wire-format
kind: predict
title: Wire format
system: Packet wire
symbol: instrument
scene: console
skills: http, reading-code
---

## Briefing

Now that the deep survey is charted, Kestrel Ridge is opening a supply exchange with Valley Station over the radio link. Programs on two different machines can't pass Python objects directly over a wire — they send text formatted as **JSON** (JavaScript Object Notation). JSON looks a lot like Python literals, with a few quiet differences that trip up every newcomer. Trace what happens when a Python dictionary makes a round trip through JSON.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

Python's `json` module converts between Python objects and JSON strings:

- `json.dumps(obj)` turns a Python object into a JSON string.
- `json.loads(text)` parses a JSON string back into Python objects.

Watch the type changes across the wire:

| Python | JSON | Back in Python |
|---|---|---|
| `True` / `False` | `true` / `false` | `True` / `False` |
| `None` | `null` | `None` |
| `tuple` `(1, 2)` | `[1, 2]` | `list` `[1, 2]` |
| `dict` key `1` (int) | `"1"` (string) | `"1"` (string!) |

JSON only has double-quoted strings, arrays, objects (with string keys), numbers, booleans, and `null`.

## Hints

1. `json.dumps` writes `True` as `true`, `None` as `null`, tuples as `[...]`, and converts integer dictionary keys to strings, preserving insertion order.
2. Notice the double quotes around every string key and value, including `"1"`.
3. After `json.loads(wire)`, `pos` comes back as a `list`, not a `tuple`, and key `1` is now `"1"`.

## Program

```python
import json

packet = {
    "active": True,
    "note": None,
    "pos": (3, 7),
    1: "north",
}

wire = json.dumps(packet)
print(wire)

back = json.loads(wire)
print(type(back["pos"]).__name__)
print(1 in back, "1" in back)
```

## Output

```text
{"active": true, "note": null, "pos": [3, 7], "1": "north"}
list
False True
```

## Restored

You traced the exact shape of JSON on the wire: lowercase booleans, `null`, arrays for tuples, and string-only object keys.
