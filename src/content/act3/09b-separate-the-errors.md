---
id: separate-the-errors
kind: terminal
title: Separate the errors
system: Pipeline
symbol: controller
scene: files
skills: streams
---

## Briefing

The sweep program checks every relay on the line. It prints a reading for each one it reaches and a complaint for each one it can't. The outpost wants the readings in one file and the complaints in another, so a single silent relay doesn't bury the rest.

## Objective

Run `~/scripts/sweep.py` once, sending its normal output to `~/reports/sweep.txt` and its errors to `~/reports/errors.txt`.

## Concept

Programs have two output streams. **Standard output** (stdout) is for results. **Standard error** (stderr) is for problems and warnings. Both appear in the terminal, so they look the same, but the shell can send them to different places.

`>` redirects only stdout. Errors still land on screen, which is often what you want: the file gets clean results, and you see what went wrong. To redirect stderr, put a `2` in front:

```bash
python3 scripts/tool.py > results.txt 2> problems.txt
```

The `2` is stderr's number. Stdout is `1`, so `>` is short for `1>`.

In Python, `print()` writes to stdout. To print to stderr, use `print("...", file=sys.stderr)`, after `import sys`. Python's own error messages and tracebacks go to stderr too.

## Hints

1. Run `python3 scripts/sweep.py` on its own first, to see all of its output together.
2. Add `> reports/sweep.txt` for the readings and `2> reports/errors.txt` for the errors, in the same command.
3. `cat` each file to check: readings in one, complaints in the other.

## Setup

```bash
mkdir -p scripts reports
cat > scripts/sweep.py <<'EOF'
# Sweeps the relay line and prints each relay's signal strength.
import sys

signals = {"KR-RELAY-1": 74, "KR-RELAY-2": 69, "KR-RELAY-3": None, "KR-RELAY-4": 41, "KR-RELAY-5": None, "KR-RELAY-6": 77}
for relay, signal in signals.items():
    if signal is None:
        print(f"{relay}: no answer", file=sys.stderr)
    else:
        print(f"{relay} {signal}%")
EOF
```

## Checks

```python
expect(
    "~/reports/sweep.txt holds the readings",
    lambda: read("~/reports/sweep.txt"),
    "KR-RELAY-1 74%\nKR-RELAY-2 69%\nKR-RELAY-4 41%\nKR-RELAY-6 77%\n",
    "Send standard output there with >.",
)
expect(
    "~/reports/errors.txt holds the complaints",
    lambda: read("~/reports/errors.txt"),
    "KR-RELAY-3: no answer\nKR-RELAY-5: no answer\n",
    "Send standard error there with 2>.",
)
```

## Solution

```bash
python3 scripts/sweep.py > reports/sweep.txt 2> reports/errors.txt
```

## Restored

Four readings in one file, two silent relays in the other. The valley crew heads for `KR-RELAY-3` and `KR-RELAY-5` first.
