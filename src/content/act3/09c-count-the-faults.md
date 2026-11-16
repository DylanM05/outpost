---
id: count-the-faults
kind: terminal
title: Count the faults
system: Pipeline
symbol: controller
scene: files
skills: streams
---

## Briefing

A week of the line log, and the outpost asks a simple question: how many faults? `grep` finds the lines, but there are too many to count by eye, and counting is a job for another program.

## Objective

Connect `grep` to `wc` with a pipe to count the lines in `~/logs/week.log` that contain `FAULT`, then report the number.

## Concept

A **pipe**, `|`, connects two programs: the standard output of the one on the left becomes the **standard input** of the one on the right.

```bash
grep heartbeat logs/week.log | wc -l
```

`grep` prints the matching lines, but not to the screen. They flow into `wc` (**w**ord **c**ount), and `-l` tells it to count lines. Only the count appears.

Many commands read standard input when you don't give them a file, which is what makes them work in a pipe. Some that are handy at the end of one:

| Command | Does |
|---|---|
| `wc -l` | Counts lines |
| `sort` | Sorts lines |
| `uniq -c` | Collapses repeated neighboring lines into one, with a count |
| `head -n 5` | Keeps only the first 5 lines |

Pipes can chain as many programs as you like. Each one does one small job.

## Hints

1. Start with just the `grep`: `grep FAULT logs/week.log`. Far too many lines to count.
2. Add `| wc -l` to the end of that command.
3. Report the number `wc` prints.

## Setup

```bash
mkdir -p logs
python3 - <<'EOF'
lines = []
for day in range(9, 16):
    for i in range(240):
        relay = f"KR-RELAY-{1 + (i * 5 + day) % 6}"
        stamp = f"2026-11-{day:02d} {6 + i // 30:02d}:{i % 30 * 2:02d}"
        if (i * 7 + day * 3) % 47 == 0:
            lines.append(f"{stamp} {relay} FAULT signal lost")
        else:
            lines.append(f"{stamp} {relay} heartbeat ok")
open("logs/week.log", "w").write("\n".join(lines) + "\n")
EOF
```

## Report

How many lines contain FAULT?

```text
36
```

## Checks

```python
expect(
    "You reported the number of fault lines",
    answer(),
    "36",
    "Count them with grep FAULT logs/week.log | wc -l.",
    reveal=False,
)
check(
    "You counted with a pipe into wc",
    lambda: any("|" in line and "wc" in [program for program, _ in _parse(line)] for line in history()),
    "Connect grep to wc -l with |, in one command.",
)
```

## Solution

```bash
grep FAULT logs/week.log | wc -l
```

## Restored

A week of faults, counted in a second. The outpost puts the number at the top of the evening report.
