---
id: maintenance-crate-dunders
title: Printable, sortable crates
system: Name plates
symbol: controller
scene: tests
skills: polymorphism
reviewSkill: polymorphism
prerequisite: line-them-up
---

## Briefing

Supply crates need readable labels, equality by SKU, and sorting by weight so `str()`, `==`, `in`, and `sorted()` all work directly on `Crate` objects.

## Objective

Write a `Crate(sku, weight)` class with:
- `__str__(self)` returning `f"{self.sku} ({self.weight} kg)"`.
- `__eq__(self, other)` returning `True` when `self.sku == other.sku` (and `False` if `not isinstance(other, Crate)`).
- `__lt__(self, other)` comparing `self.weight < other.weight`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Implement `__str__`, `__eq__`, and `__lt__` on `Crate`.
2. In `__eq__`, check `isinstance(other, Crate)` before reading `other.sku`.

## Starter

```python
```

## Checks

```python
C = get("Crate")
expect("str(Crate('FUEL', 12))", lambda: str(C("FUEL", 12)), "FUEL (12 kg)")
expect("equality compares sku", lambda: C("FUEL", 12) == C("FUEL", 8), True)
expect("inequality on different sku", lambda: C("FUEL", 12) == C("ROPE", 12), False)
expect("sorted orders by weight", lambda: [c.sku for c in sorted([C("A", 9), C("B", 2), C("C", 5)])], ["B", "C", "A"])
```

## Hidden checks

```python
expect("comparison against non-Crate returns False", lambda: C("A", 1) == "A", False)
expect("max() picks heaviest crate", lambda: max([C("A", 3), C("B", 11), C("C", 7)]).sku, "B")
```

## Solution

```python
class Crate:
    def __init__(self, sku, weight):
        self.sku = sku
        self.weight = weight

    def __str__(self):
        return f"{self.sku} ({self.weight} kg)"

    def __eq__(self, other):
        if not isinstance(other, Crate):
            return False
        return self.sku == other.sku

    def __lt__(self, other):
        return self.weight < other.weight
```

## Restored

Crates print, match, and sort cleanly across every manifest script.
