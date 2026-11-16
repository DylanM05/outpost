---
id: join-the-pipeline
kind: terminal
title: Join the pipeline
system: Pipeline
symbol: controller
scene: files
skills: streams
---

## Briefing

`grep`, `sort`, and `wc` each do one small job, and pipes let them work together. Your own Python programs can join in. The crew wants a program that reads log lines from a pipe and reports the weakest signal among them.

## Objective

Write `~/scripts/weakest.py`. It reads lines from standard input, each ending in a signal strength like `signal 64%`, and prints the line with the lowest signal. Then use it at the end of a pipeline:

```bash
grep KR-RELAY-4 logs/signals.log | python3 scripts/weakest.py
```

## Concept

A program's **standard input** (stdin) is where it reads from: normally the keyboard, but the output of a pipe when there is one. In Python, `sys.stdin` can be looped over like a file, one line at a time:

```python
import sys

for line in sys.stdin:
    line = line.strip()
    print(line.upper())
```

Each line still has its `\n` on the end, which `.strip()` removes.

A program that reads stdin and writes stdout fits anywhere in a pipeline. That's the **Unix philosophy**: write programs that do one thing well, and make them work together through plain text.

The shell can also feed a file to stdin with `<`:

```bash
python3 scripts/weakest.py < logs/signals.log
```

## Hints

1. Each line looks like `09:12 KR-RELAY-4 signal 64%`. The number is the last word, without the `%`: `int(line.split()[-1].rstrip("%"))`.
2. Loop over `sys.stdin`, keeping the weakest line so far and its signal, the same way you would find the smallest number in a list.
3. Print the weakest line at the end. Test it with the pipeline from the objective.

## Setup

```bash
mkdir -p logs scripts
python3 - <<'EOF'
lines = []
for i in range(300):
    relay = f"KR-RELAY-{1 + i % 6}"
    signal = 40 + (i * 37) % 55
    if relay == "KR-RELAY-4" and i == 147:
        signal = 12
    if relay == "KR-RELAY-2" and i == 61:
        signal = 3
    lines.append(f"{6 + i // 30:02d}:{i % 30 * 2:02d} {relay} signal {signal}%")
open("logs/signals.log", "w").write("\n".join(lines) + "\n")
EOF
```

## Checks

```python
piped = run("grep KR-RELAY-4 logs/signals.log | python3 scripts/weakest.py")
expect(
    "grep KR-RELAY-4 logs/signals.log | python3 scripts/weakest.py",
    piped.out,
    "10:54 KR-RELAY-4 signal 12%\n",
    "Print only the weakest line, once, after reading every line." if piped.code == 0 else f"Python reported: {(piped.err.strip().splitlines() or ['nothing'])[-1]}",
)
expect(
    "Reading the whole log from stdin",
    lambda: run("python3 scripts/weakest.py < logs/signals.log").out,
    "08:02 KR-RELAY-2 signal 3%\n",
    "Read every line of standard input, whichever relay it's from.",
)
check(
    "You used weakest.py at the end of a pipe",
    lambda: any("|" in line and "weakest.py" in line for line in history()),
    "Run the pipeline from the objective.",
)
```

## Hidden checks

```python
expect(
    "Three lines from stdin",
    lambda: run("python3 scripts/weakest.py", input="07:00 KR-A signal 50%\n07:02 KR-B signal 7%\n07:04 KR-C signal 99%\n").out,
    "07:02 KR-B signal 7%\n",
)
```

## Solution

```bash
# A player writes the program in nano. printf writes the same file unattended.
printf 'import sys\n\nweakest = None\nlowest = 101\nfor line in sys.stdin:\n    line = line.strip()\n    signal = int(line.split()[-1].rstrip("%%"))\n    if signal < lowest:\n        lowest = signal\n        weakest = line\nprint(weakest)\n' > scripts/weakest.py
grep KR-RELAY-4 logs/signals.log | python3 scripts/weakest.py
```

## Restored

`KR-RELAY-4`, signal 12%, just before eleven. Your program joins the crew's toolkit, and it works with every tool they already have.
