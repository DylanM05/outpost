---
id: tour-the-beacons
title: Tour the beacons
system: Supply ledger
symbol: equipment
scene: tests
skills: dynamic-programming, complexity
---

## Briefing

Once a month, an inspection drone leaves beacon `0`, visits every other beacon on the ridge exactly once, and returns to beacon `0`. Finding the guaranteed shortest round trip is the **Traveling Salesman Problem (TSP)**. Unlike Dijkstra's algorithm or dynamic programming over canisters, nobody knows an algorithm that solves TSP exactly in polynomial time for large inputs (`NP-hard`). For 6 beacons you can check every order; for 60 beacons, checking every order would outlast the sun — so you reach for a fast **heuristic** instead.

## Objective

Write two functions given a symmetric `n × n` distance matrix `dist` (where `dist[i][j]` is the distance between beacon `i` and beacon `j`):

1. `exact_tour(dist)`: returns the **exact minimum** round-trip distance starting at `0`, visiting every beacon `1..n-1` once in some order, and returning to `0`. (If `n <= 1`, return `0`.)
2. `greedy_tour(dist)`: uses the **nearest-neighbor heuristic** — start at beacon `0`, repeatedly fly to the closest unvisited beacon (breaking ties by smaller beacon index), and after visiting all beacons, fly back to `0`. Return the total distance flown. (If `n <= 1`, return `0`.)

```python
# 4 beacons with distances:
exact_tour(dist)   # tries all (n-1)! orders -> guaranteed optimal
greedy_tour(dist)  # O(n^2) -> instant on 60 beacons, usually close to optimal
```

## Concept

Complexity classes separate what computers can solve exactly at scale from what requires approximation:

- **P (polynomial time):** problems solvable in `O(n)`, `O(n log n)`, `O(n²)`, etc. — sorting, BFS, Dijkstra, canister DP.
- **NP:** problems where a proposed solution can be *verified* in polynomial time (checking a TSP tour's length takes `O(n)`!).
- **NP-hard (like TSP):** no polynomial-time exact algorithm is known. With `n` beacons there are `(n - 1)!` orders: `5! = 120`, `10! = 3.6 million`, `60! > 10⁸¹`.

When an exact search blows up factorially, engineers combine two tools: exact search on tiny instances (`itertools.permutations(range(1, n))`), and fast heuristics like nearest-neighbor (`O(n²)`) on large instances.

## Hints

1. In `exact_tour(dist)`: `from itertools import permutations`. Loop `for order in permutations(range(1, n)):`, sum `dist[0][order[0]]`, each consecutive `dist[a][b]`, and `dist[order[-1]][0]`, and keep the minimum.
2. In `greedy_tour(dist)`: keep `current = 0`, `unvisited = set(range(1, n))`, and `total = 0`. While `unvisited`: pick `nxt = min(unvisited, key=lambda b: (dist[current][b], b))`, add `dist[current][nxt]`, remove `nxt`, set `current = nxt`. Finally add `dist[current][0]`.
3. Handle `n <= 1` by returning `0` in both functions.

## Starter: guided

```python
from itertools import permutations


def exact_tour(dist):
    n = len(dist)
    if n <= 1:
        return 0
    best = float("inf")
    for order in permutations(range(1, n)):
        # Compute round-trip distance 0 -> order[0] -> ... -> order[-1] -> 0.
        pass
    return best


def greedy_tour(dist):
    n = len(dist)
    if n <= 1:
        return 0
    unvisited = set(range(1, n))
    current = 0
    total = 0
    while unvisited:
        # Pick the closest unvisited beacon (lowest index on tie), fly there, remove it.
        break
    return total + dist[current][0]
```

## Starter: standard

```python
from itertools import permutations


def exact_tour(dist):
    return 0


def greedy_tour(dist):
    return 0
```

## Starter: challenge

```python
```

## Checks

```python
# 4 beacons where greedy gets fooled into taking a long return edge (1+1+1+10=13 vs 1+2+1+2=6)
trap = [
    [0, 1, 2, 10],
    [1, 0, 1, 2],
    [2, 1, 0, 1],
    [10, 2, 1, 0],
]
expect("exact_tour finds optimal 6 on 4 beacons", lambda: get("exact_tour")(trap), 6)
expect("greedy_tour follows nearest neighbor (13) on trap graph", lambda: get("greedy_tour")(trap), 13)

square = [
    [0, 3, 5, 4],
    [3, 0, 4, 5],
    [5, 4, 0, 3],
    [4, 5, 3, 0],
]
expect("exact_tour on 4-beacon rectangle", lambda: get("exact_tour")(square), 14)
expect("greedy_tour on 4-beacon rectangle", lambda: get("greedy_tour")(square), 14)
```

## Hidden checks

```python
expect("exact_tour on 1 beacon", lambda: get("exact_tour")([[0]]), 0)
expect("greedy_tour on 1 beacon", lambda: get("greedy_tour")([[0]]), 0)

# 6 beacons
six = [
    [0, 10, 15, 20, 12, 18],
    [10, 0, 8, 25, 14, 9],
    [15, 8, 0, 11, 16, 7],
    [20, 25, 11, 0, 6, 13],
    [12, 14, 16, 6, 0, 19],
    [18, 9, 7, 13, 19, 0],
]
expect("exact_tour on 6 beacons", lambda: get("exact_tour")(six), 55)

# 60 beacons on a circle/grid — exact would need 59! steps; greedy runs in O(n^2)
n = 60
big = [[abs(i - j) for j in range(n)] for i in range(n)]
expect("greedy_tour on 60 beacons runs fast", lambda: get("greedy_tour")(big), 118)
```

## Solution

```python
from itertools import permutations


def exact_tour(dist):
    n = len(dist)
    if n <= 1:
        return 0
    best = float("inf")
    for order in permutations(range(1, n)):
        total = dist[0][order[0]]
        for i in range(len(order) - 1):
            total += dist[order[i]][order[i + 1]]
        total += dist[order[-1]][0]
        if total < best:
            best = total
    return best


def greedy_tour(dist):
    n = len(dist)
    if n <= 1:
        return 0
    unvisited = set(range(1, n))
    current = 0
    total = 0
    while unvisited:
        nxt = min(unvisited, key=lambda b: (dist[current][b], b))
        total += dist[current][nxt]
        unvisited.remove(nxt)
        current = nxt
    return total + dist[current][0]
```

## Restored

The inspection scheduler uses exact search for small beacon clusters and switches to the nearest-neighbor heuristic for ridge-wide tours.
