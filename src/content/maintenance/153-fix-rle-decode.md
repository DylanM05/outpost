---
id: maintenance-fix-rle-decode
title: Fix an off-by-one and validation bug in RLE decoding
system: Column vault
symbol: equipment
scene: tests
skills: analytical-storage
reviewSkill: analytical-storage
prerequisite: reservoir-sample
---

## Briefing

The column decoder in the editor silently emits one extra copy per run and accepts negative run counts! Fix `decode_rle(runs)` so it validates counts and reconstructs exact columns.

## Objective

Fix `decode_rle(runs)` in the editor where `runs` is a list of `(value, count)` pairs:
- Raise `ValueError` if any `count < 0` (note: `count == 0` is allowed and emits zero copies).
- Return the flat list containing each `value` repeated `count` times in order.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `if count < 0: raise ValueError(...)`.
2. Notice the buggy loop uses `range(count + 1)` — change to `out.extend([value] * count)`!

## Starter

```python
def decode_rle(runs):
    out = []
    for value, count in runs:
        for _ in range(count + 1):
            out.append(value)
    return out
```

## Checks

```python
expect("decodes exact run counts", lambda: get("decode_rle")([("OK", 3), ("WARN", 1), ("OK", 2)]), ["OK", "OK", "OK", "WARN", "OK", "OK"])
expect("zero count emits nothing", lambda: get("decode_rle")([("X", 0), ("Y", 2)]), ["Y", "Y"])
```

## Hidden checks

```python
def _neg():
    try:
        get("decode_rle")([("OK", -2)])
        return False
    except ValueError:
        return True
expect("negative run count raises ValueError", _neg, True)
```

## Solution

```python
def decode_rle(runs):
    out = []
    for value, count in runs:
        if count < 0:
            raise ValueError("run count must be >= 0")
        out.extend([value] * count)
    return out
```

## Restored

RLE column pages now decode exact run lengths and reject corrupted negative counts.
