---
id: add-the-level-option
kind: terminal
title: Add a level option
system: Log scanner
symbol: equipment
scene: files
skills: programs, streams
---

## Briefing

The counts are useful, but when there are faults, the crew wants to see them. `logscan` should take an option, the way `ls` takes `-a`, that prints just the lines at one level.

Here's `logscan` as the last job left it.

## Objective

Rewrite `~/logscan/logscan.py`'s argument handling with `argparse`, and add a `--level` option:

- `python3 logscan/logscan.py logs/relay.log` prints the counts, as before.
- `python3 logscan/logscan.py logs/relay.log --level FAULT` prints only the FAULT lines, exactly as they appear in the log.
- `python3 logscan/logscan.py --help` prints a usage message that mentions `--level`.

## Concept

Reading `sys.argv` by hand gets messy once a program has options. Python's standard library includes `argparse`, which reads them for you:

```python
import argparse

parser = argparse.ArgumentParser(description="Summarize a relay log.")
parser.add_argument("logfile", help="the log to read")
parser.add_argument("--level", help="print only the lines at this level")
args = parser.parse_args()
```

- An argument name without dashes, like `logfile`, is **positional** and required.
- One with dashes, like `--level`, is an **option**, and it's `None` when it isn't given.
- `args.logfile` and `args.level` hold the values.

For free, `argparse` prints a usage message for `--help`, and when an argument is missing it prints an error and exits with code `2`.

## Hints

1. Replace `path = sys.argv[1]` with the parser from the lesson, and use `args.logfile` wherever you used `path`.
2. If `args.level` is set, print each line whose level matches, with `print(line, end="")` or `line.rstrip("\n")`, and skip the counts.
3. Try all three commands from the objective. Watch for blank lines between your output lines.

## Setup

```bash
mkdir -p logs logscan
python3 - <<'EOF'
messages = {"INFO": "heartbeat ok", "WARN": "signal weak", "FAULT": "antenna current out of range"}
lines = []
for i in range(600):
    relay = f"KR-RELAY-{1 + (i * 7) % 6}"
    level = "FAULT" if i % 37 == 5 else "WARN" if i % 9 == 4 else "INFO"
    minute = 360 + i * 2
    lines.append(f"{minute // 60 % 24:02d}:{minute % 60:02d} {relay} {level} {messages[level]}")
open("logs/relay.log", "w").write("\n".join(lines) + "\n")
EOF
cat > logscan/logscan.py <<'EOF'
# logscan: summarizes a relay log.
# Usage: python3 logscan.py LOGFILE
import sys

path = sys.argv[1]

counts = {"INFO": 0, "WARN": 0, "FAULT": 0}
with open(path) as log:
    for line in log:
        counts[line.split()[2]] += 1
for level, count in counts.items():
    print(level, count)
EOF
```

## Checks

```python
counts = run("python3 logscan/logscan.py logs/relay.log")
expect(
    "python3 logscan/logscan.py logs/relay.log",
    counts.out,
    "INFO 517\nWARN 66\nFAULT 17\n",
    "Without --level, print the counts as before." if counts.code == 0 else f"Python reported: {(counts.err.strip().splitlines() or ['nothing'])[-1]}",
)
expect(
    "python3 logscan/logscan.py logs/relay.log --level FAULT",
    lambda: run("python3 logscan/logscan.py logs/relay.log --level FAULT").out,
    "".join(line + "\n" for line in (read("~/logs/relay.log") or "").splitlines() if line.split()[2:3] == ["FAULT"]),
    "Print each FAULT line once, exactly as it is in the log, with no blank lines between them.",
)
check(
    "--help describes --level",
    lambda: "--level" in run("python3 logscan/logscan.py --help").out,
    "Build the arguments with argparse, and add the --level option.",
)
```

## Hidden checks

```python
run("mkdir -p /tmp/scan && printf '07:00 KR-A INFO ok\\n07:02 KR-B WARN signal weak\\n07:04 KR-A WARN signal weak\\n' > /tmp/scan/warn.log")
expect(
    "--level WARN on another log",
    lambda: run("python3 logscan/logscan.py /tmp/scan/warn.log --level WARN").out,
    "07:02 KR-B WARN signal weak\n07:04 KR-A WARN signal weak\n",
)
expect(
    "Run with no log at all, it exits with code 2",
    lambda: run("python3 logscan/logscan.py").code,
    2,
    "argparse does this for you when logfile is a positional argument.",
)
```

## Solution

```bash
cat > logscan/logscan.py <<'EOF'
# logscan: summarizes a relay log.
import argparse

parser = argparse.ArgumentParser(description="Summarize a relay log.")
parser.add_argument("logfile", help="the log to read")
parser.add_argument("--level", help="print only the lines at this level")
args = parser.parse_args()

counts = {"INFO": 0, "WARN": 0, "FAULT": 0}
with open(args.logfile) as log:
    for line in log:
        level = line.split()[2]
        if args.level is None:
            counts[level] += 1
        elif level == args.level:
            print(line, end="")
if args.level is None:
    for level, count in counts.items():
        print(level, count)
EOF
python3 logscan/logscan.py logs/relay.log --level FAULT
```

## Restored

Seventeen fault lines, and nothing else. `logscan --help` even explains itself, which is more than most of the crew's tools do.
