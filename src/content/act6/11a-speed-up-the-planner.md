---
id: speed-up-the-planner
title: Speed up the planner
system: Deep survey core
symbol: controller
scene: work
skills: linear-structures, heaps, shortest-paths, dynamic-programming, complexity
assessment: true
---

## Briefing

The deep survey core already works — on tiny test cases. Every one of its three planning routines returns the right answer on small data and grinds to a halt on the full winter map:

1. `dispatch_queue(events)` re-sorts the whole ticket list on every dispatch instead of using a priority queue.
2. `cheapest_leg(network, start, goal)` explores every simple path with DFS instead of running Dijkstra's algorithm.
3. `max_payload_value(capacity, items)` solves 0/1 knapsack with unmemoized recursion, recomputing the same subproblems exponentially many times.

Make all three fast enough for the full ridge without changing a single answer.

This is an independent mission. Hints unlock after your second submission. Use what you've learned across the deep survey, and Python's documentation if you need it.

## Objective

Speed up all three functions while keeping their exact behavior:

1. `dispatch_queue(events)`: processes `("add", urgency, name)` and `("next",)` events and returns the list of dispatched `name`s (smallest `urgency` first, alphabetical `name` on ties; ignore `"next"` when empty). Must handle 900 events within 12,000 comparisons.
2. `cheapest_leg(network, start, goal)`: `network` maps each station to a list of `(neighbor, fuel_cost)` pairs (positive costs). Return the minimum total fuel cost from `start` to `goal`, or `-1` if unreachable. Must handle a 200-station weighted network without exponential path search.
3. `max_payload_value(capacity, items)`: `items` is a list of `(weight, value)` pairs of positive integers; each item can be taken at most once. Return the maximum total value whose total weight is `<= capacity`. Must avoid exponential recursion (use a DP table or memoization) and handle 60 items with capacity 150 within the read budget.

```python
dispatch_queue([("add", 5, "b"), ("add", 1, "a"), ("next",)])  # ["a"]
cheapest_leg({"S": [("A", 2), ("G", 9)], "A": [("G", 3)], "G": []}, "S", "G")  # 5
max_payload_value(5, [(2, 3), (3, 4), (4, 6)])  # 7  (items (2, 3) and (3, 4))
```

## Concept

Each bottleneck maps to a structure or technique from the deep survey:

| Routine | Why it's slow | Reach for |
|---|---|---|
| `dispatch_queue` | Sorting the backlog on every `"next"` (`O(n² log n)`) | `heapq` (`heappush` / `heappop`) |
| `cheapest_leg` | Trying every simple path (`O(2ⁿ)`) | Dijkstra's algorithm with `heapq` |
| `max_payload_value` | Unmemoized recursion (`O(2ⁿ)`) | Bottom-up 0/1 knapsack DP table (or memoization reading `items` once) |

For 0/1 knapsack in bottom-up DP: keep `dp = [0] * (capacity + 1)` and for each `(w, val)` in `items`, loop `cap` **downwards** from `capacity` to `w` so each item is only used once:

```python
dp[cap] = max(dp[cap], dp[cap - w] + val)
```

## Hints

1. In `dispatch_queue`: replace `backlog.sort(); backlog.pop(0)` with `heapq.heappush(heap, (urgency, name))` and `heapq.heappop(heap)`.
2. In `cheapest_leg`: run Dijkstra with `best = {start: 0}` and `heap = [(0, start)]`, skipping popped entries where `cost > best[node]`.
3. In `max_payload_value`: build `dp = [0] * (capacity + 1)`. For each `weight, value` in `items`, update `for c in range(capacity, weight - 1, -1): dp[c] = max(dp[c], dp[c - weight] + value)`. Return `dp[capacity]`.

## Starter

```python
# All three routines give the right answers on small inputs, but blow past
# the deep survey's work budgets on full maps. Optimize them without changing
# their results.


def dispatch_queue(events):
    backlog = []
    sent = []
    for event in events:
        if event[0] == "add":
            backlog.append((event[1], event[2]))
        elif event[0] == "next" and backlog:
            backlog.sort()
            _, name = backlog.pop(0)
            sent.append(name)
    return sent


def cheapest_leg(network, start, goal):
    best = [float("inf")]

    def dfs(node, cost, seen):
        if node == goal:
            if cost < best[0]:
                best[0] = cost
            return
        for neighbor, fuel in network.get(node, []):
            if neighbor not in seen:
                seen.add(neighbor)
                dfs(neighbor, cost + fuel, seen)
                seen.remove(neighbor)

    dfs(start, 0, {start})
    return -1 if best[0] == float("inf") else best[0]


def max_payload_value(capacity, items):
    def solve(i, cap):
        if i == len(items) or cap == 0:
            return 0
        weight, value = items[i]
        skip = solve(i + 1, cap)
        if weight <= cap:
            take = value + solve(i + 1, cap - weight)
            if take > skip:
                return take
        return skip

    return solve(0, capacity)
```

## Checks

```python
expect(
    "dispatch_queue example",
    lambda: get("dispatch_queue")([("add", 5, "b"), ("add", 1, "a"), ("next",), ("add", 3, "c"), ("next",)]),
    ["a", "c"],
)
expect(
    "cheapest_leg example",
    lambda: get("cheapest_leg")({"S": [("A", 2), ("G", 9)], "A": [("G", 3)], "G": []}, "S", "G"),
    5,
)
expect(
    "max_payload_value example",
    lambda: get("max_payload_value")(5, [(2, 3), (3, 4), (4, 6)]),
    7,
)

# Quick work-meter checks visible on Run so bottlenecks are immediately clear.
small_items = tracked([(2, 3), (3, 4), (4, 5), (1, 2), (5, 8), (2, 4), (3, 6), (4, 7), (2, 3), (1, 2), (3, 5), (4, 6)])
expect_within(
    "max_payload_value(12 items, capacity 15)",
    lambda: get("max_payload_value")(15, small_items),
    27,
    small_items,
    300,
    "Use a dynamic programming table or memoization instead of unmemoized exponential recursion.",
)
```

## Hidden checks

```python
import heapq as _hq

# 1. dispatch_queue at scale (900 events)
raw_u = [(i * 7919) % 1000 for i in range(600)]
comp_u = compared(raw_u)
plain_ev = []
comp_ev = []
for i in range(600):
    plain_ev.append(("add", raw_u[i], f"j{i:03d}"))
    comp_ev.append(("add", comp_u[i], f"j{i:03d}"))
    if i >= 200 and i % 2 == 0:
        plain_ev.append(("next",))
        comp_ev.append(("next",))
for _ in range(100):
    plain_ev.append(("next",))
    comp_ev.append(("next",))

def _ref_dispatch(events):
    h = []
    out = []
    for ev in events:
        if ev[0] == "add":
            _hq.heappush(h, (ev[1], ev[2]))
        elif ev[0] == "next" and h:
            out.append(_hq.heappop(h)[1])
    return out

expect_comparisons(
    "dispatch_queue(900 events)",
    lambda: get("dispatch_queue")(comp_ev),
    _ref_dispatch(plain_ev),
    len(comp_ev),
    12000,
    "Use heapq instead of re-sorting on every 'next' event.",
)

# 2. cheapest_leg on a diamond ladder (fast check that catches exponential DFS cleanly)
class _CountedGraph(dict):
    def __init__(self, data):
        super().__init__(data)
        self.lookups = 0
    def get(self, key, default=None):
        self.lookups += 1
        return super().get(key, default)
    def __getitem__(self, key):
        self.lookups += 1
        return super().__getitem__(key)
    def items(self):
        self.lookups += len(self)
        return super().items()
    def copy(self):
        self.lookups += len(self)
        return super().copy()

ladder = {}
for i in range(11):
    ladder[f"a{i}"] = [(f"b{i}", 1), (f"c{i}", 2)]
    ladder[f"b{i}"] = [(f"a{i+1}", 2)]
    ladder[f"c{i}"] = [(f"a{i+1}", 1)]
ladder["a11"] = []
cg = _CountedGraph(ladder)
out_ladder = safe(lambda: get("cheapest_leg")(cg, "a0", "a11"))
expect("cheapest_leg on 11-stage diamond network", lambda: out_ladder.value if out_ladder.error is None else (_ for _ in ()).throw(RuntimeError(out_ladder.error)), 33)
dijkstra_fast = check(
    "cheapest_leg avoids exponential path exploration (<= 100 lookups on 34-node ladder)",
    lambda: out_ladder.error is None and cg.lookups <= 100,
    f"Made {cg.lookups:,} graph lookups on 34 nodes. Use Dijkstra's algorithm with heapq.",
)
emit("work", label="cheapest_leg(34-node diamond ladder)", size=34, looks=cg.lookups, budget=100, unit="node lookups", passed=dijkstra_fast and out_ladder.value == 33, error=out_ladder.error)

if dijkstra_fast:
    expect("cheapest_leg unreachable returns -1", lambda: get("cheapest_leg")(ladder, "a11", "a0"), -1)
    expect("cheapest_leg start == goal returns 0", lambda: get("cheapest_leg")(ladder, "a0", "a0"), 0)
    big_net = {}
    for i in range(200):
        edges = []
        if i + 1 < 200:
            edges.append((f"n{i+1}", 3))
        if i + 3 < 200:
            edges.append((f"n{i+3}", 7))
        if i + 7 < 200:
            edges.append((f"n{i+7}", 20))
        big_net[f"n{i}"] = edges
    # Reference Dijkstra
    def _ref_dijkstra(net, s, g):
        best = {s: 0}
        h = [(0, s)]
        while h:
            c, u = _hq.heappop(h)
            if c > best[u]:
                continue
            if u == g:
                return c
            for v, w in net.get(u, []):
                nc = c + w
                if nc < best.get(v, 10**12):
                    best[v] = nc
                    _hq.heappush(h, (nc, v))
        return -1
    expect("cheapest_leg(200-station network)", lambda: get("cheapest_leg")(big_net, "n0", "n199"), _ref_dijkstra(big_net, "n0", "n199"))

# 3. max_payload_value at scale (60 items, capacity 150)
# Gate on the small_items read budget so exponential recursion never hangs here.
gate_items = tracked([(2, 3), (3, 4), (4, 5), (1, 2), (5, 8), (2, 4), (3, 6), (4, 7), (2, 3), (1, 2), (3, 5), (4, 6), (2, 3), (3, 5)])
dp_fast = expect_within(
    "max_payload_value(14 items, capacity 18)",
    lambda: get("max_payload_value")(18, gate_items),
    32,
    gate_items,
    400,
    "Use a dynamic programming table or memoization instead of exponential recursion.",
)
if dp_fast:
    big_plain = [(1 + (i * 7) % 19, 3 + (i * 13) % 31) for i in range(60)]
    dp_ref = [0] * 151
    for w, v in big_plain:
        for c in range(150, w - 1, -1):
            if dp_ref[c - w] + v > dp_ref[c]:
                dp_ref[c] = dp_ref[c - w] + v
    big_items = tracked(big_plain)
    expect_within(
        "max_payload_value(60 items, capacity 150)",
        lambda: get("max_payload_value")(150, big_items),
        dp_ref[150],
        big_items,
        10000,
        "Use a dynamic programming table or memoize subproblems.",
    )
    expect("max_payload_value with 0 capacity", lambda: get("max_payload_value")(0, [(1, 10)]), 0)
    expect("max_payload_value with empty items", lambda: get("max_payload_value")(50, []), 0)
```

## Solution

```python
import heapq


def dispatch_queue(events):
    heap = []
    sent = []
    for event in events:
        if event[0] == "add":
            heapq.heappush(heap, (event[1], event[2]))
        elif event[0] == "next" and heap:
            _, name = heapq.heappop(heap)
            sent.append(name)
    return sent


def cheapest_leg(network, start, goal):
    best = {start: 0}
    heap = [(0, start)]
    while heap:
        cost, node = heapq.heappop(heap)
        if cost > best[node]:
            continue
        if node == goal:
            return cost
        for neighbor, fuel in network.get(node, []):
            new_cost = cost + fuel
            if neighbor not in best or new_cost < best[neighbor]:
                best[neighbor] = new_cost
                heapq.heappush(heap, (new_cost, neighbor))
    return -1


def max_payload_value(capacity, items):
    dp = [0] * (capacity + 1)
    for weight, value in items:
        for c in range(capacity, weight - 1, -1):
            candidate = dp[c - weight] + value
            if candidate > dp[c]:
                dp[c] = candidate
    return dp[capacity]
```

## Restored

Every bottleneck in the deep survey core is gone. Dispatches pull from a heap, routes follow Dijkstra across the ridge, and cargo plans fill in a single table pass. The deep survey is fully online.
