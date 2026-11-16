---
id: read-the-labels
title: Read the labels
system: Depot
symbol: equipment
scene: tests
skills: strings, types
---

## Briefing

Crates from the old supply runs were labeled by hand, and the labels are a mess, full of extra spaces and random capitals. Each one names a kind of supply and a quantity, like `" FUEL-12 "`. The depot needs them in one consistent form.

## Objective

Write `read_label(label)`. Return a tuple containing the kind, in lowercase with the surrounding spaces removed, and the quantity as an integer.

```python
read_label(" FUEL-12 ")  # ("fuel", 12)
read_label("Seed-40")    # ("seed", 40)
```

## Concept

Strings have **methods**: functions that belong to a value, called with a dot. String methods return a new string and leave the original unchanged:

```python
label = "  Water  "
label.strip()   # "Water", with spaces removed from both ends
label.lower()   # "  water  "
label.upper()   # "  WATER  "
```

You can chain them: `label.strip().lower()` gives `"water"`.

`split()` breaks a string into a list of pieces. With nothing in the parentheses it splits wherever there's a space. Give it a character to split on that instead:

```python
"06:14".split(":")  # ["06", "14"]
```

The pieces are still strings, so use `int()` to turn digits into a number.

## Hints

1. Clean the label first: `clean = label.strip().lower()`.
2. `clean.split("-")` gives a list like `["fuel", "12"]`.
3. Return `(parts[0], int(parts[1]))`.

## Starter: guided

```python
def read_label(label):
    clean = label.strip()
    parts = clean.split("-")
    kind = parts[0]
    quantity = parts[1]
    # kind should be lowercase, and quantity should be an int.
    return (kind, quantity)


print(read_label(" FUEL-12 "))
```

## Starter: standard

```python
def read_label(label):
    # Return (kind, quantity): the kind in lowercase, the quantity as an int.
    return ("", 0)
```

## Starter: challenge

```python
```

## Checks

```python
expect('read_label(" FUEL-12 ")', lambda: get("read_label")(" FUEL-12 "), ("fuel", 12))
expect('read_label("Seed-40")', lambda: get("read_label")("Seed-40"), ("seed", 40))
```

## Hidden checks

```python
expect('read_label("tools-1")', lambda: get("read_label")("tools-1"), ("tools", 1))
expect('read_label("   WATER-250")', lambda: get("read_label")("   WATER-250"), ("water", 250))
expect('read_label("Medical-3   ")', lambda: get("read_label")("Medical-3   "), ("medical", 3))
```

## Solution

```python
def read_label(label):
    parts = label.strip().lower().split("-")
    return (parts[0], int(parts[1]))
```

## Restored

Every crate in the depot has a clean label. "FUEL-12", "fuel-12 " and "Fuel-12" finally count as the same thing.
