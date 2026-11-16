---
id: maintenance-first-repeat
title: Catch the first repeat
system: Index vault
symbol: instrument
scene: work
skills: hashing
reviewSkill: hashing
prerequisite: fill-the-lift
---

## Briefing

The vault's scanner logs codes as crates pass. The moment any code comes round a second time, the conveyor has looped, and the vault wants to know which code it was.

## Objective

Write `first_repeat(codes)`. Going through the codes in order, return the first code that has already appeared earlier. If no code repeats, return `None`. Read each code only once or twice: the hidden test scans 2,000 codes with a budget of 4,000 reads.

```python
first_repeat([5, 1, 3, 1, 5])  # 1, which repeats before 5 does
first_repeat([5, 1, 3])        # None
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Remember the codes you've seen in a set.
2. Check each code against the set before adding it.
3. Return the first code that's already in the set, or `None` after the loop.

## Starter

```python
```

## Checks

```python
expect("first_repeat([5, 1, 3, 1, 5])", lambda: get("first_repeat")([5, 1, 3, 1, 5]), 1)
expect("first_repeat([5, 1, 3])", lambda: get("first_repeat")([5, 1, 3]), None)
```

## Hidden checks

```python
expect("first_repeat([])", lambda: get("first_repeat")([]), None)
expect("first_repeat([4, 4])", lambda: get("first_repeat")([4, 4]), 4)
expect("first_repeat([0, 9, 0, 9])", lambda: get("first_repeat")([0, 9, 0, 9]), 0)
long_loop = tracked(list(range(1999)) + [1500])
expect_within(
    "first_repeat(2,000 codes)",
    lambda: get("first_repeat")(long_loop),
    1500,
    long_loop,
    4000,
    "Remember the codes in a set instead of searching back through the list.",
)
```

## Solution

```python
def first_repeat(codes):
    seen = set()
    for code in codes:
        if code in seen:
            return code
        seen.add(code)
    return None
```

## Restored

The scanner names the code where the conveyor looped, and the crew finds the jammed diverter in minutes.
