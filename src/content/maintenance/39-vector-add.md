---
id: maintenance-vector-add
title: Combine wind vectors
system: Name plates
symbol: controller
scene: tests
skills: polymorphism
reviewSkill: polymorphism
prerequisite: line-them-up
---

## Briefing

Wind gusts add component by component: `(dx1, dy1) + (dx2, dy2) = (dx1 + dx2, dy1 + dy2)`. Implement `+`, `==`, and `str()` on a `Vector` class using Python's special methods.

## Objective

Write a `Vector(x, y)` class with:
- `__add__(self, other)` returning a **new** `Vector(self.x + other.x, self.y + other.y)` without mutating `self` or `other`.
- `__eq__(self, other)` returning `True` when `isinstance(other, Vector)` and `(self.x, self.y) == (other.x, other.y)`.
- `__str__(self)` returning `f"({self.x}, {self.y})"`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. `+` calls `__add__(self, other)`; return a brand-new `Vector(...)`.
2. `==` calls `__eq__(self, other)`.

## Starter

```python
```

## Checks

```python
V = get("Vector")
a, b = V(3, -1), V(2, 5)
expect("a + b returns new Vector(5, 4)", lambda: a + b == V(5, 4), True)
expect("str(a + b)", lambda: str(a + b), "(5, 4)")
expect("a and b are not mutated", lambda: (a == V(3, -1), b == V(2, 5)), (True, True))
```

## Hidden checks

```python
expect("Vector != tuple", lambda: V(1, 2) == (1, 2), False)
expect("chained addition", lambda: V(1, 1) + V(2, 3) + V(-3, -4) == V(0, 0), True)
```

## Solution

```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __eq__(self, other):
        if not isinstance(other, Vector):
            return False
        return self.x == other.x and self.y == other.y

    def __str__(self):
        return f"({self.x}, {self.y})"
```

## Restored

Wind vectors now combine cleanly with `+` across the flight planner.
