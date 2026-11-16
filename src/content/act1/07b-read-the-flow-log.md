---
id: read-the-flow-log
kind: predict
title: Read the flow log
system: Reservoir
symbol: equipment
scene: console
skills: loops, reading-code
---

## Briefing

A flow meter on the reservoir line logs every reading. It's meant to skip readings of zero, when the pump is resting, and to stop logging the moment the sensor reports a fault, because nothing after a fault can be trusted. Trace the log program to check it does both.

## Objective

Predict exactly what this program prints.

## Concept

Two statements change how a loop runs:

- `continue` skips the rest of the current pass. The loop moves straight on to the next item.
- `break` ends the whole loop immediately. Any items left are never looked at, and the program carries on with the code after the loop.

```python
for n in [1, 2, 3, 4]:
    if n == 2:
        continue
    if n == 4:
        break
    print(n)
print("done")
```

```text
1
3
done
```

Both usually sit inside an `if`, because a loop that always skips or always stops isn't much of a loop.

## Hints

1. Take the readings one at a time, and write down what each pass prints before moving on.
2. At 0, `continue` jumps straight to the next reading. Nothing is added to the total, and `flow 0` is never printed.
3. At -1, `break` ends the loop. The 9 is never read, but the line after the loop still runs.

## Program

```python
flows = [12, 0, 15, -1, 9]
total = 0

for flow in flows:
    if flow == 0:
        print("no flow")
        continue
    if flow < 0:
        print("sensor fault")
        break
    total += flow
    print(f"flow {flow}")

print(f"total {total}")
```

## Output

```text
flow 12
no flow
flow 15
sensor fault
total 27
```

## Restored

The log behaves exactly as designed: resting readings skipped, and nothing recorded after a fault. The crew swaps out the faulty sensor before the next shift.
