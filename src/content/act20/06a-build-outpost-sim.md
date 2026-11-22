---
id: build-outpost-sim
title: Build an end-to-end 2D outpost spatial simulator
system: Observatory audit
symbol: controller
scene: tests
assessment: true
skills: spatial-geometry, spatial-indexing, simulation-pathfinding
---

## Briefing

Bring the entire observatory online in a single `OutpostSim`: deterministic fixed-timestep 2D drone physics, spatial-hash proximity indexing, grid line-of-sight radar checks, and A\* waypoint routing over a unified terrain map.

## Concept

`OutpostSim(grid, cell_size=4.0, dt=1.0)` models a world of width `W = len(grid[0])` and height `H = len(grid)` where `grid` is a list of strings (`'.'` open cost 1, `'~'` rough cost 3, `'#'` wall):
- **`spawn_drone(drone_id, x, y, vx=0.0, vy=0.0)`:** Registers (or resets) a drone at `(x, y)` with velocity `(vx, vy)` inside `[0, W] x [0, H]` (raise `ValueError` if out of bounds) and indexes it in the internal spatial hash grid of size `cell_size`.
- **`position(drone_id)`:** Returns `(x, y)` for `drone_id` (raise `KeyError` if unknown).
- **`step(elapsed_time)`:** Adds `elapsed_time` (must be `>= 0`) to the internal accumulator and runs fixed `dt` ticks while `acc >= dt - 1e-12`. On each tick:
  - Advances every drone `x += vx * dt`, `y += vy * dt`.
  - Reflects elastically (`restitution = 1.0`) off `[0, W]` horizontally and `[0, H]` vertically (`if x < 0: x = -x; vx = abs(vx)`, `if x > W: x = 2*W - x; vx = -abs(vx)`, clamped to `[0, W]`, and similarly for `y` and `H`).
  - Re-indexes moved drones in the spatial hash grid!
  - Returns the integer number of fixed ticks executed during this `step()` call.
- **`nearby_drones(drone_id, radius)`:** Uses the spatial hash grid to return a **sorted** list of *other* drone IDs (excluding `drone_id` itself) within Euclidean distance `<= radius` of `drone_id`.
- **`can_see(id_a, id_b)`:** Maps each drone's continuous position `(x, y)` to its grid cell `(min(H - 1, max(0, int(y))), min(W - 1, max(0, int(x))))` and checks Bresenham line-of-sight on `grid` (blocking on `'#'` cells AND diagonal double-wall corner pinches!).
- **`route_between(start_cell, goal_cell)`:** Runs A\* (4-way, `'.'=1`, `'~'=3`, `'#'` wall, Manhattan heuristic) and returns the optimal list of `(r, c)` tuples from `start_cell` to `goal_cell`, or `None` if unreachable.

## Objective

Implement `OutpostSim` with `spawn_drone`, `position`, `step`, `nearby_drones`, `can_see`, and `route_between`.

## Hints

1. Keep `self.drones[drone_id] = [x, y, vx, vy]` and sync a `SpatialHashGrid` helper (or cell dict) after every tick so `nearby_drones` never scans stale buckets.
2. In `step()`, guard floating-point remainder jitter by using `while self.acc + 1e-12 >= self.dt: self.acc = max(0.0, self.acc - self.dt)`!
3. Remember coordinate order carefully: world coordinates are `(x, y)` (`x` = column, `y` = row), while grid cells are `(row, col)` = `(int(y), int(x))`!

## Starter: guided

```python
import heapq
import math


class OutpostSim:
    def __init__(self, grid, cell_size=4.0, dt=1.0):
        if not grid or not grid[0] or cell_size <= 0 or dt <= 0:
            raise ValueError("invalid simulator config")
        self.grid = grid
        self.height = len(grid)
        self.width = len(grid[0])
        self.cell_size = cell_size
        self.dt = dt
        self.acc = 0.0
        self.drones = {}
        self.cells = {}
        self.drone_cell = {}

    def spawn_drone(self, drone_id, x, y, vx=0.0, vy=0.0):
        pass

    def position(self, drone_id):
        x, y, _, _ = self.drones[drone_id]
        return (x, y)

    def step(self, elapsed_time):
        return 0

    def nearby_drones(self, drone_id, radius):
        return []

    def can_see(self, id_a, id_b):
        return False

    def route_between(self, start_cell, goal_cell):
        return None
```

## Starter: standard

```python
import heapq
import math


class OutpostSim:
    def __init__(self, grid, cell_size=4.0, dt=1.0):
        pass

    def spawn_drone(self, drone_id, x, y, vx=0.0, vy=0.0):
        pass

    def position(self, drone_id):
        pass

    def step(self, elapsed_time):
        pass

    def nearby_drones(self, drone_id, radius):
        pass

    def can_see(self, id_a, id_b):
        pass

    def route_between(self, start_cell, goal_cell):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
_ARENA = [
    "......",
    "..##..",
    "......",
    ".~~~~.",
    "......",
]

def _sim_flow():
    sim = get("OutpostSim")(_ARENA, cell_size=2.0, dt=0.5)
    sim.spawn_drone("alpha", 0.5, 0.5, vx=2.0, vy=0.0)
    sim.spawn_drone("beta", 4.5, 0.5, vx=0.0, vy=0.0)
    sim.spawn_drone("gamma", 2.5, 2.5, vx=0.0, vy=0.0)
    # Accumulator: 0.75 runs 1 tick (rem 0.25); next 0.75 runs 2 ticks (total 3 ticks = 1.5s -> alpha x=3.5)
    t1 = sim.step(0.75)
    t2 = sim.step(0.75)
    ax, ay = sim.position("alpha")
    near = sim.nearby_drones("alpha", 1.5)
    los_clear = sim.can_see("alpha", "beta")     # both on row 0 -> clear!
    los_blocked = sim.can_see("alpha", "gamma")  # wall on row 1 col 2-3 blocks (0,3) -> (2,2)!
    route = sim.route_between((0, 0), (2, 3))
    return (t1, t2, (round(ax, 4), round(ay, 4)), near, los_clear, los_blocked, route[0], route[-1], len(route))
expect("integrates fixed-step physics, spatial hashing, line-of-sight, and A* routing", _sim_flow, (
    1,
    2,
    (3.5, 0.5),
    ["beta"],
    True,
    False,
    (0, 0),
    (2, 3),
    6,
))
```

## Hidden checks

```python
def _bounce_and_weighted_route():
    grid = [
        ".~~~.",
        ".#.#.",
        ".....",
    ]
    sim = get("OutpostSim")(grid, cell_size=2.0, dt=1.0)
    sim.spawn_drone("d1", 4.5, 0.5, vx=1.0, vy=0.0)
    # 1 tick: x = 4.5 + 1.0 = 5.5 -> bounces off W=5 to 4.5 with vx=-1.0; next tick -> 3.5!
    sim.step(2.0)
    px, py = sim.position("d1")
    route = sim.route_between((0, 0), (0, 4))
    # Optimal route goes around the bottom (len 9) instead of through '~' (cost 10)
    return ((round(px, 4), round(py, 4)), len(route), route[-1])
expect("bounces elastically off world bounds and picks cost-optimal A* route", _bounce_and_weighted_route, ((3.5, 0.5), 9, (0, 4)))

def _diag_pinch_and_oob():
    grid = [
        ".#.",
        "#..",
        "...",
    ]
    sim = get("OutpostSim")(grid, cell_size=2.0, dt=1.0)
    sim.spawn_drone("a", 0.5, 0.5)
    sim.spawn_drone("b", 1.5, 1.5)
    pinch_blocked = not sim.can_see("a", "b")
    try:
        sim.spawn_drone("bad", 10.0, 0.5)
        oob_rejected = False
    except ValueError:
        oob_rejected = True
    return (pinch_blocked, oob_rejected)
expect("blocks diagonal corner pinch in can_see and rejects out-of-bounds spawn", _diag_pinch_and_oob, (True, True))
```

## Solution

```python
import heapq
import math


class OutpostSim:
    def __init__(self, grid, cell_size=4.0, dt=1.0):
        if not grid or not grid[0] or cell_size <= 0 or dt <= 0:
            raise ValueError("invalid simulator config")
        self.grid = grid
        self.height = len(grid)
        self.width = len(grid[0])
        self.cell_size = cell_size
        self.dt = dt
        self.acc = 0.0
        self.drones = {}
        self.cells = {}
        self.drone_cell = {}

    def _bucket(self, x, y):
        return (math.floor(x / self.cell_size), math.floor(y / self.cell_size))

    def _index_drone(self, drone_id, x, y):
        old = self.drone_cell.get(drone_id)
        new = self._bucket(x, y)
        if old == new:
            return
        if old is not None:
            b = self.cells.get(old)
            if b is not None:
                b.discard(drone_id)
                if not b:
                    del self.cells[old]
        self.drone_cell[drone_id] = new
        self.cells.setdefault(new, set()).add(drone_id)

    def spawn_drone(self, drone_id, x, y, vx=0.0, vy=0.0):
        if not (0.0 <= x <= self.width and 0.0 <= y <= self.height):
            raise ValueError("drone position out of world bounds")
        self.drones[drone_id] = [float(x), float(y), float(vx), float(vy)]
        self._index_drone(drone_id, float(x), float(y))

    def position(self, drone_id):
        x, y, _, _ = self.drones[drone_id]
        return (x, y)

    def step(self, elapsed_time):
        if elapsed_time < 0:
            raise ValueError("elapsed_time must be non-negative")
        self.acc += elapsed_time
        ticks = 0
        while self.acc + 1e-12 >= self.dt:
            self.acc = max(0.0, self.acc - self.dt)
            ticks += 1
            for drone_id, state in self.drones.items():
                x, y, vx, vy = state
                x += vx * self.dt
                y += vy * self.dt
                if x < 0.0:
                    x = min(float(self.width), -x)
                    vx = abs(vx)
                elif x > self.width:
                    x = max(0.0, 2.0 * self.width - x)
                    vx = -abs(vx)
                if y < 0.0:
                    y = min(float(self.height), -y)
                    vy = abs(vy)
                elif y > self.height:
                    y = max(0.0, 2.0 * self.height - y)
                    vy = -abs(vy)
                state[0], state[1], state[2], state[3] = x, y, vx, vy
                self._index_drone(drone_id, x, y)
        return ticks

    def nearby_drones(self, drone_id, radius):
        if radius < 0:
            raise ValueError("radius must be non-negative")
        qx, qy, _, _ = self.drones[drone_id]
        min_cx = math.floor((qx - radius) / self.cell_size)
        max_cx = math.floor((qx + radius) / self.cell_size)
        min_cy = math.floor((qy - radius) / self.cell_size)
        max_cy = math.floor((qy + radius) / self.cell_size)
        r_sq = radius * radius
        out = []
        for cx in range(min_cx, max_cx + 1):
            for cy in range(min_cy, max_cy + 1):
                for other_id in self.cells.get((cx, cy), ()):
                    if other_id == drone_id:
                        continue
                    ox, oy, _, _ = self.drones[other_id]
                    if (ox - qx) ** 2 + (oy - qy) ** 2 <= r_sq:
                        out.append(other_id)
        out.sort()
        return out

    def _to_cell(self, drone_id):
        x, y, _, _ = self.drones[drone_id]
        r = min(self.height - 1, max(0, int(y)))
        c = min(self.width - 1, max(0, int(x)))
        return (r, c)

    def can_see(self, id_a, id_b):
        r0, c0 = self._to_cell(id_a)
        r1, c1 = self._to_cell(id_b)
        if self.grid[r0][c0] == "#" or self.grid[r1][c1] == "#":
            return False
        dr = abs(r1 - r0)
        dc = -abs(c1 - c0)
        sr = 1 if r0 < r1 else -1
        sc = 1 if c0 < c1 else -1
        err = dr + dc
        r, c = r0, c0
        while True:
            if r == r1 and c == c1:
                return True
            pr, pc = r, c
            e2 = 2 * err
            if e2 >= dc:
                err += dc
                r += sr
            if e2 <= dr:
                err += dr
                c += sc
            if self.grid[r][c] == "#":
                return False
            if r != pr and c != pc:
                if self.grid[pr][c] == "#" and self.grid[r][pc] == "#":
                    return False

    def route_between(self, start_cell, goal_cell):
        sr, sc = start_cell
        gr, gc = goal_cell
        if not (0 <= sr < self.height and 0 <= sc < self.width and 0 <= gr < self.height and 0 <= gc < self.width):
            return None
        if self.grid[sr][sc] == "#" or self.grid[gr][gc] == "#":
            return None

        def h(cell):
            return abs(cell[0] - gr) + abs(cell[1] - gc)

        pq = [(h(start_cell), 0, start_cell)]
        best_g = {start_cell: 0}
        came_from = {}
        while pq:
            _, g, node = heapq.heappop(pq)
            if g > best_g.get(node, float("inf")):
                continue
            if node == goal_cell:
                path = [node]
                while node in came_from:
                    node = came_from[node]
                    path.append(node)
                path.reverse()
                return path
            r, c = node
            for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < self.height and 0 <= nc < self.width:
                    ch = self.grid[nr][nc]
                    if ch == "#":
                        continue
                    ng = g + (3 if ch == "~" else 1)
                    nxt = (nr, nc)
                    if ng < best_g.get(nxt, float("inf")):
                        best_g[nxt] = ng
                        came_from[nxt] = node
                        heapq.heappush(pq, (ng + h(nxt), ng, nxt))
        return None
```

## Restored

The observatory simulator is online — fixed-step physics, spatial hashing, radar line-of-sight, and A\* routing all operate in concert across Kestrel Ridge.
