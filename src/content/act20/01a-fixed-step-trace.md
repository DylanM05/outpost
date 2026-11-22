---
id: fixed-step-trace
kind: predict
title: Trace a fixed-timestep accumulator loop
system: Optics bench
symbol: instrument
scene: console
skills: simulation-pathfinding, reading-code
---

## Briefing

Game engines and physics simulations decouple variable rendering frame times from fixed physics ticks using an **accumulator loop**: each frame adds its elapsed time `delta` to `acc`, then drains as many whole `dt` physics steps as fit while carrying the leftover remainder into the next frame.

## Objective

Trace the fixed-timestep accumulator below and predict **every line it prints**.

## Concept

When `dt = 10` and `vel = 2`:
- Each frame adds `delta` to `acc`.
- While `acc >= dt`, subtract `dt` from `acc`, increment `steps`, and advance `pos += vel`.
- The leftover `acc` is **not** discarded — it carries into the next frame so total simulated time never drifts!

## Hints

1. Frame 1: `acc = 0 + 15 = 15` -> 1 step (`pos = 2`, `rem = 5`).
2. Frame 2: `acc = 5 + 12 = 17` -> 1 step (`pos = 4`, `rem = 7`).
3. Frame 3: `acc = 7 + 8 = 15` -> 1 step (`pos = 6`, `rem = 5`).
4. Frame 4: `acc = 5 + 15 = 20` -> 2 steps (`pos = 10`, `rem = 0`).

## Program

```python
dt = 10
vel = 2
pos = 0
acc = 0

for frame, delta in enumerate([15, 12, 8, 15], start=1):
    acc += delta
    steps = 0
    while acc >= dt:
        acc -= dt
        pos += vel
        steps += 1
    print(f"frame {frame}: steps={steps} pos={pos} rem={acc}")
```

## Output

```text
frame 1: steps=1 pos=2 rem=5
frame 2: steps=1 pos=4 rem=7
frame 3: steps=1 pos=6 rem=5
frame 4: steps=2 pos=10 rem=0
```

## Restored

You traced how a fixed-timestep accumulator keeps simulation physics deterministic across uneven frame durations.
