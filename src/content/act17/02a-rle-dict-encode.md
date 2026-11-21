---
id: rle-dict-encode
title: Compress columns with dictionary + RLE encoding
system: Column vault
symbol: equipment
scene: tests
skills: analytical-storage
---

## Briefing

Analytical formats like Apache Parquet shrink repeated status columns (`["OK", "OK", "OK", "WARN", "OK"]`) by 10–50x using two steps: **Dictionary Encoding** (replace strings with small integer IDs) followed by **Run-Length Encoding (RLE)** (collapse consecutive identical IDs into `(id, count)` runs).

## Concept

Given `values = ["OK", "OK", "OK", "WARN", "WARN", "OK"]`:
1. Build dictionary in first-seen order: `vocab = ["OK", "WARN"]` (`"OK" -> 0`, `"WARN" -> 1`).
2. Encode into `(code, run_length)` pairs: `runs = [(0, 3), (1, 2), (0, 1)]`.
3. Decode back losslessly by expanding each `(code, count)` into `[vocab[code]] * count`!

## Objective

Implement two functions:
1. `encode_column(values)` — returns `{"dict": vocab_list, "runs": [(code, count), ...]}` using first-seen dictionary ordering. Empty `values` returns `{"dict": [], "runs": []}`.
2. `decode_column(encoded)` — reconstructs and returns the original list of values from `{"dict": ..., "runs": ...}`.

## Hints

1. Maintain `index = {}` alongside `vocab = []` for $O(1)$ dictionary lookup.
2. In `encode_column`, if `runs` is non-empty and `runs[-1][0] == code`, replace `runs[-1]` with `(code, runs[-1][1] + 1)`; otherwise append `(code, 1)`.

## Starter: guided

```python
def encode_column(values):
    vocab = []
    lookup = {}
    runs = []
    for val in values:
        if val not in lookup:
            lookup[val] = len(vocab)
            vocab.append(val)
        code = lookup[val]
        # Extend last run if same code, else append (code, 1)
        pass
    return {"dict": vocab, "runs": runs}


def decode_column(encoded):
    vocab = encoded["dict"]
    out = []
    # Expand each (code, count) into out
    return out
```

## Starter: standard

```python
def encode_column(values):
    pass


def decode_column(encoded):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "encodes repeated strings with dictionary and RLE",
    lambda: get("encode_column")(["OK", "OK", "OK", "WARN", "WARN", "OK"]),
    {"dict": ["OK", "WARN"], "runs": [(0, 3), (1, 2), (0, 1)]},
)
expect(
    "round-trips column losslessly",
    lambda: get("decode_column")(get("encode_column")(["a", "b", "b", "c", "a", "a"])),
    ["a", "b", "b", "c", "a", "a"],
)
```

## Hidden checks

```python
expect("handles empty column", lambda: (get("encode_column")([]), get("decode_column")({"dict": [], "runs": []})), ({"dict": [], "runs": []}, []))
```

## Solution

```python
def encode_column(values):
    vocab = []
    lookup = {}
    runs = []
    for val in values:
        code = lookup.get(val)
        if code is None:
            code = len(vocab)
            lookup[val] = code
            vocab.append(val)
        if runs and runs[-1][0] == code:
            runs[-1] = (code, runs[-1][1] + 1)
        else:
            runs.append((code, 1))
    return {"dict": vocab, "runs": runs}


def decode_column(encoded):
    vocab = encoded["dict"]
    out = []
    for code, count in encoded["runs"]:
        out.extend([vocab[code]] * count)
    return out
```

## Restored

Repetitive telemetry columns now compress into compact dictionary-coded RLE blocks and decode losslessly.
