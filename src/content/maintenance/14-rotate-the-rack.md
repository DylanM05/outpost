---
id: maintenance-rotate-the-rack
title: Rotate the rack
system: Sensor mast
symbol: instrument
scene: tests
skills: lists
reviewSkill: lists
prerequisite: find-the-jumps
---

## Briefing

The mast's spare sensors sit in a rotating rack, and each morning the sensor at the front goes to the back. Every other program shares the rack's list, so it has to change in place.

## Objective

Write `rotate(rack)`. Move the first item to the end, so every other item moves one place toward the front. Change the list itself; the function doesn't need to return anything. An empty rack stays empty.

```python
rack = ["A", "B", "C"]
rotate(rack)
print(rack)  # ["B", "C", "A"]
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Handle the empty rack first, so there's always a first item to move.
2. Remember the first item, then shift each item one position toward the front.
3. Put the remembered item in the last position. Assigning to positions changes the list in place.

## Starter

```python
```

## Checks

```python
def after(rack):
    get("rotate")(rack)
    return rack

hint = "Change the list itself instead of building a new one."
expect('rack after rotate(["A", "B", "C"])', lambda: after(["A", "B", "C"]), ["B", "C", "A"], hint)
expect("rack after rotate([1, 2])", lambda: after([1, 2]), [2, 1], hint)
```

## Hidden checks

```python
expect("rack after rotate([])", lambda: after([]), [], hint)
expect('rack after rotate(["solo"])', lambda: after(["solo"]), ["solo"], hint)
rack = [1, 2, 3, 4]
after(rack)
expect("rotating [1, 2, 3, 4] twice", lambda: after(rack), [3, 4, 1, 2], hint)
```

## Solution

```python
def rotate(rack):
    if len(rack) == 0:
        return
    first = rack[0]
    for i in range(1, len(rack)):
        rack[i - 1] = rack[i]
    rack[-1] = first
```

## Restored

The rack turns one slot each morning, and every sensor gets its turn on the mast.
