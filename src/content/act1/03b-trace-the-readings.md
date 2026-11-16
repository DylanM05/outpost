---
id: trace-the-readings
kind: predict
title: Trace the readings
system: Gauges
symbol: instrument
scene: console
skills: variables, reading-code
---

## Briefing

The gauge panel runs a short calculation every hour, and the previous engineer was sure it was wrong. Before you change anything, trace it by hand and find out what it actually prints.

## Objective

Predict exactly what this program prints.

## Concept

To trace code, keep a note of every variable's current value and update it as each line runs.

Assigning one variable to another copies the value it has **at that moment**:

```python
a = 5
b = a
a = a + 1
```

After these lines, `a` is 6 and `b` is still 5. Changing `a` later doesn't change `b`.

A line like `fuel = fuel - 15` works out the right-hand side using the current value, then stores the result back under the same name.

## Hints

1. On paper, write down `fuel` and `reserve`, and update them after each line.
2. `reserve = fuel` copies the value 40. It doesn't link the two names.
3. When `fuel` drops to 25, `reserve` stays at 40. The last line adds them.

## Program

```python
fuel = 40
reserve = fuel
fuel = fuel - 15
print(fuel)
print(reserve)
fuel = fuel + reserve
print(f"Total: {fuel}")
```

## Output

```text
25
40
Total: 65
```

## Restored

The hourly calculation was right all along. It just had to be read in order. The gauge figures go into the log unchanged.
