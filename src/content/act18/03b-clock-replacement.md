---
id: clock-replacement
title: Evict pages with the Clock (second-chance) algorithm
system: Page vault
symbol: equipment
scene: tests
skills: virtual-memory
---

## Briefing

Maintaining an exact LRU linked list on every single CPU memory access is too expensive in hardware. Instead, real operating systems use the **Clock (second-chance) algorithm** with just a single hardware reference bit per frame!

## Concept

Maintain a circular array of `capacity` frame slots `[None, ..., None]` and a clock `hand = 0`:
- Each loaded slot holds `[page_id, ref_bit]`.
- On accessing `page`:
  - **Hit:** if `page` is already in a slot, set its `ref_bit = 1` (do NOT move `hand`!).
  - **Fault:** increment `faults += 1`. Loop:
    - If `slots[hand]` is `None` (empty slot): place `[page, 1]` there, advance `hand = (hand + 1) % capacity`, and stop!
    - Else if `slots[hand][1] == 1`: give it a **second chance** — clear `slots[hand][1] = 0`, advance `hand = (hand + 1) % capacity`, and keep scanning!
    - Else (`ref_bit == 0`): evict `slots[hand]`, place `[page, 1]` there, advance `hand = (hand + 1) % capacity`, and stop!

## Objective

Write `simulate_clock(pages, capacity)` validating `capacity >= 1` (else `ValueError`), simulating every page access in `pages`, and returning:
`{"faults": faults, "hits": hits, "frames": [slot[0] for slot in slots if slot is not None]}`.

## Hints

1. Keep `slots = [None] * capacity` and `hand = 0`.
2. Remember: on a cache HIT, set `ref_bit = 1` and leave `hand` untouched! On a FAULT, always advance `hand = (hand + 1) % capacity` after placing the new page.

## Starter: guided

```python
def simulate_clock(pages, capacity):
    if capacity < 1:
        raise ValueError("capacity must be >= 1")
    slots = [None] * capacity
    hand = 0
    faults = 0
    hits = 0
    for page in pages:
        # Check for hit; if miss, scan with clock hand clearing ref=1 until empty or ref==0
        pass
    return {"faults": faults, "hits": hits, "frames": [s[0] for s in slots if s is not None]}
```

## Starter: standard

```python
def simulate_clock(pages, capacity):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "grants second chance to referenced page before evicting",
    lambda: get("simulate_clock")(["A", "B", "C", "D", "B", "E"], capacity=3),
    {"faults": 5, "hits": 1, "frames": ["D", "B", "E"]},
)
expect(
    "tracks hits without advancing clock hand",
    lambda: get("simulate_clock")(["X", "Y", "X", "Y"], capacity=2),
    {"faults": 2, "hits": 2, "frames": ["X", "Y"]},
)
```

## Hidden checks

```python
expect("empty access trace has zero faults", lambda: get("simulate_clock")([], capacity=4), {"faults": 0, "hits": 0, "frames": []})
def _bad():
    try:
        get("simulate_clock")(["A"], 0)
        return False
    except ValueError:
        return True
expect("capacity < 1 raises ValueError", _bad, True)
```

## Solution

```python
def simulate_clock(pages, capacity):
    if capacity < 1:
        raise ValueError("capacity must be >= 1")
    slots = [None] * capacity
    hand = 0
    faults = 0
    hits = 0
    for page in pages:
        found = False
        for slot in slots:
            if slot is not None and slot[0] == page:
                slot[1] = 1
                hits += 1
                found = True
                break
        if found:
            continue
        faults += 1
        while True:
            slot = slots[hand]
            if slot is None:
                slots[hand] = [page, 1]
                hand = (hand + 1) % capacity
                break
            if slot[1] == 1:
                slot[1] = 0
                hand = (hand + 1) % capacity
            else:
                slots[hand] = [page, 1]
                hand = (hand + 1) % capacity
                break
    return {"faults": faults, "hits": hits, "frames": [s[0] for s in slots if s is not None]}
```

## Restored

The Clock page-replacement sweeper approximates LRU cleanly using a single reference bit per frame.
