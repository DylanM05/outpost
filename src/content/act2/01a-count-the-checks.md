---
id: count-the-checks
kind: predict
title: Count the checks
system: Survey desk
symbol: controller
scene: console
skills: complexity, reading-code
---

## Briefing

The survey office's computer is slow, and the surveyors blame the hardware. Before anyone orders a new one, count how much work its programs actually do. How long a program takes depends less on the machine than on the shape of its loops.

## Objective

Predict exactly what this program prints.

## Concept

One way to measure a program is to count its steps: here, how many times the innermost line runs.

A loop over `n` items runs its body `n` times. A loop inside another loop over the same items runs its body `n × n` times, because the inner loop runs all the way through on every pass of the outer one.

`count_pairs` uses the pair loop from the solar array's lift: the inner loop starts at `i + 1`, so each pair of markers comes up once, and no marker is paired with itself.

That difference matters as data grows. Double the items, and the single loop does twice the work, but the nested loop does **four** times as much.

Programmers describe this with **Big-O** notation. A single loop is `O(n)`, or **linear**. The nested loop is `O(n²)`, or **quadratic**. Big-O describes how the work grows, not the exact count.

## Hints

1. Track the count separately for each function call. The inner loop finishes completely on every pass of the outer loop.
2. `count_checks` does 3 × 3 checks for three markers. With six markers, it's 6 × 6.
3. In `count_pairs`, `j` starts at `i + 1`, so each pair is counted once. For three markers that's 2 + 1 + 0.

## Program

```python
def count_checks(markers):
    checks = 0
    for a in markers:
        for b in markers:
            checks += 1
    return checks


def count_pairs(markers):
    pairs = 0
    for i in range(len(markers)):
        for j in range(i + 1, len(markers)):
            pairs += 1
    return pairs


three = ["A", "B", "C"]
six = ["A", "B", "C", "D", "E", "F"]
print(count_checks(three))
print(count_checks(six))
print(count_pairs(three))
print(len(six))
```

## Output

```text
9
36
3
6
```

## Restored

The hardware was fine. One report compared every marker with every other marker, twice over. The surveyors start counting their loops.
