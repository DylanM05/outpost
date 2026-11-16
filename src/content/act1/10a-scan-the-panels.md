---
id: scan-the-panels
kind: predict
title: Scan the panels
system: Solar array
symbol: equipment
scene: console
skills: loops, reading-code
---

## Briefing

The solar array is laid out in rows of panels, and its inspection script checks them one at a time. It also pairs up crates of spare panels for the lift. Before trusting either part, trace the order it works in.

## Objective

Predict exactly what this program prints.

## Concept

A loop can sit inside another loop. The **inner** loop runs all the way through on every single pass of the **outer** loop:

```python
for side in ["L", "R"]:
    for n in range(2):
        print(side, n)
```

```text
L 0
L 1
R 0
R 1
```

Indentation decides which loop a line belongs to. A line indented under the inner loop runs on every inner pass. A line indented only under the outer loop runs once per outer pass, after the inner loop has finished.

The inner loop can depend on the outer one. With `range(i + 1, len(items))`, the inner loop starts just past the outer position `i`. That's how you visit every **pair** of items exactly once, without pairing an item with itself.

## Hints

1. The inner loop finishes all three columns before the outer loop moves on to the next row.
2. `print(f"row {row} done")` is indented under the outer loop only, so it runs once per row, after that row's columns.
3. In the second part, `j` always starts one past `i`. When `i` is the last position, the inner loop has nothing to do.

## Program

```python
for row in ["A", "B"]:
    for col in range(3):
        print(f"{row}{col}")
    print(f"row {row} done")

crates = ["fuel", "seed", "tools"]
for i in range(len(crates)):
    for j in range(i + 1, len(crates)):
        print(crates[i], crates[j])
```

## Output

```text
A0
A1
A2
row A done
B0
B1
B2
row B done
fuel seed
fuel tools
seed tools
```

## Restored

Row by row, panel by panel: the inspection order is right, and every pair of crates comes up exactly once.
