---
id: number-the-bays
kind: predict
title: Number the bays
system: Supply line
symbol: equipment
scene: console
skills: loops, lists, reading-code
---

## Briefing

Every crate on the conveyor sits in a numbered bay, but the painted numbers wore off years ago. The terminal still knows them: it numbers the bays the same way it numbers a list. Trace its bay listing so you can read the conveyor the way the terminal does.

## Objective

Predict exactly what this program prints.

## Concept

`range()` produces a run of whole numbers for a loop to count through:

- `range(4)` gives `0, 1, 2, 3`. It starts at 0 and stops **before** 4.
- `range(2, 5)` gives `2, 3, 4`. It starts at the first number and stops before the second.

```python
for n in range(3):
    print(n)
```

```text
0
1
2
```

List positions also start at 0, so a list of 4 items has positions 0 to 3. `range(len(crates))` produces exactly those positions, which makes it the standard way to loop over a list by position:

```python
crates = ["fuel", "seed"]
for i in range(len(crates)):
    print(i, crates[i])
```

```text
0 fuel
1 seed
```

Keep the two apart: `i` is the **position**, a number, and `crates[i]` is the **item** at that position. The last position is always `len(crates) - 1`, one less than the length.

## Hints

1. `range(3)` starts at 0 and stops before 3, so it gives three numbers.
2. `range(1, 3)` gives 1 and 2. Position 1 is the **second** crate, because positions count from 0.
3. There are 4 crates, so the positions are 0 to 3, and `len(crates) - 1` is 3.

## Program

```python
crates = ["fuel", "seed", "tools", "medical"]

for i in range(3):
    print(i)

for i in range(1, 3):
    print(crates[i])

for i in range(len(crates)):
    print(f"bay {i}: {crates[i]}")

print(len(crates))
print(crates[len(crates) - 1])
```

## Output

```text
0
1
2
seed
tools
bay 0: fuel
bay 1: seed
bay 2: tools
bay 3: medical
4
medical
```

## Restored

The crew paints the bay numbers back on, starting from 0, the way the terminal counts. Nobody walks to the wrong end of the conveyor again.
