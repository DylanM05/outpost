---
id: weighted-balancer
title: Balance traffic with smooth weighted round-robin
system: Load director
symbol: controller
scene: tests
skills: traffic-engineering
---

## Briefing

Naive weighted round-robin with weights `{A: 5, B: 1, C: 1}` sends five consecutive requests straight to `A` (`A, A, A, A, A, B, C`), hammering `A` with mini-bursts! Nginx's **Smooth Weighted Round-Robin** spreads traffic evenly (`A, B, A, C, A, A, A`) while still honoring exact weights and skipping unhealthy backends.

## Concept

Each healthy backend $i$ has a fixed positive `weight` $w_i$ and a mutable `current` weight (starting at `0`).
On every `next_backend()` call over the currently **healthy** backends:
1. If no healthy backends exist, return `None`.
2. Let `total = sum(w_i for healthy backends)`.
3. For every healthy backend, add its weight: `current[i] += w_i`.
4. Pick the healthy backend with the **largest `current[i]`** (breaking ties by original insertion order!).
5. Subtract `total` from the chosen backend: `current[chosen] -= total`.
6. Return the chosen backend's name!

Check `{A: 5, B: 1, C: 1}`:
- Step 1: `[5, 1, 1]` -> pick `A` -> `[-2, 1, 1]`
- Step 2: `[3, 2, 2]` -> pick `A` -> `[-4, 2, 2]`
- Step 3: `[1, 3, 3]` -> pick `B` -> `[1, -4, 3]`
- Step 4: `[6, -3, 4]` -> pick `A` -> `[-1, -3, 4]`
- Step 5: `[4, -2, 5]` -> pick `C` -> `[4, -2, -2]`
- Step 6: `[9, -1, -1]` -> pick `A` -> `[2, -1, -1]`
- Step 7: `[7, 0, 0]` -> pick `A` -> `[0, 0, 0]`!
Sequence: `["A", "A", "B", "A", "C", "A", "A"]` — exact 5:1:1 ratio, smoothly interleaved!

## Objective

Implement `SmoothWeightedBalancer(backends)` where `backends` is a list of `(name, weight)` tuples (validate every `weight >= 1`, raising `ValueError` otherwise):
- `set_healthy(self, name, healthy: bool)` — marks backend healthy or unhealthy (raise `KeyError` if unknown).
- `next_backend(self)` — runs one smooth weighted step across healthy backends and returns the chosen backend name (or `None` if none are healthy).

## Hints

1. Keep backends in insertion order (`self.order`) with `weights`, `current`, and `healthy` dicts.
2. Only update `current[name]` for healthy backends during `next_backend()`, and pick with `max(live, key=lambda n: self.current[n])` (Python's `max` preserves first-seen tie order!).

## Starter: guided

```python
class SmoothWeightedBalancer:
    def __init__(self, backends):
        self.order = []
        self.weights = {}
        self.current = {}
        self.healthy = {}
        for name, weight in backends:
            if weight < 1:
                raise ValueError("weight must be >= 1")
            self.order.append(name)
            self.weights[name] = weight
            self.current[name] = 0
            self.healthy[name] = True

    def set_healthy(self, name, healthy):
        if name not in self.healthy:
            raise KeyError(name)
        self.healthy[name] = bool(healthy)

    def next_backend(self):
        live = [n for n in self.order if self.healthy[n]]
        if not live:
            return None
        # Add weights, pick max current, subtract total weight, return chosen
        return None
```

## Starter: standard

```python
class SmoothWeightedBalancer:
    def __init__(self, backends):
        pass

    def set_healthy(self, name, healthy):
        pass

    def next_backend(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _smooth():
    lb = get("SmoothWeightedBalancer")([("A", 5), ("B", 1), ("C", 1)])
    return [lb.next_backend() for _ in range(7)]
expect("matches Nginx smooth weighted round-robin sequence", _smooth, ["A", "A", "B", "A", "C", "A", "A"])

def _unhealthy():
    lb = get("SmoothWeightedBalancer")([("A", 2), ("B", 1)])
    lb.set_healthy("A", False)
    r1 = [lb.next_backend() for _ in range(3)]
    lb.set_healthy("B", False)
    r2 = lb.next_backend()
    return (r1, r2)
expect("skips unhealthy nodes and returns None when all are down", _unhealthy, (["B", "B", "B"], None))
```

## Hidden checks

```python
def _bad_weight():
    try:
        get("SmoothWeightedBalancer")([("A", 0)])
        return False
    except ValueError:
        return True
expect("non-positive weight raises ValueError", _bad_weight, True)
```

## Solution

```python
class SmoothWeightedBalancer:
    def __init__(self, backends):
        self.order = []
        self.weights = {}
        self.current = {}
        self.healthy = {}
        for name, weight in backends:
            if weight < 1:
                raise ValueError("weight must be >= 1")
            self.order.append(name)
            self.weights[name] = weight
            self.current[name] = 0
            self.healthy[name] = True

    def set_healthy(self, name, healthy):
        if name not in self.healthy:
            raise KeyError(name)
        self.healthy[name] = bool(healthy)

    def next_backend(self):
        live = [n for n in self.order if self.healthy[n]]
        if not live:
            return None
        total = sum(self.weights[n] for n in live)
        for n in live:
            self.current[n] += self.weights[n]
        chosen = max(live, key=lambda n: self.current[n])
        self.current[chosen] -= total
        return chosen
```

## Restored

The load director spreads weighted requests smoothly without bursty hot-spotting and routes cleanly around failed nodes.
