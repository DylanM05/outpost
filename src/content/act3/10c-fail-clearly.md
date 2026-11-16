---
id: fail-clearly
kind: terminal
title: Fail clearly
system: Log scanner
symbol: equipment
scene: files
skills: programs, streams
---

## Briefing

The watchdog wants to run `logscan` every hour and act on the result without reading it, so the result has to be in the exit code. And when somebody mistypes a log's name, `logscan` dumps a Python traceback that scares the night shift. Good tools fail with one clear line.

Here's `logscan` as the last job left it.

## Objective

Change `~/logscan/logscan.py` so that, when counting:

- it exits with code `0` when the log has no FAULT lines, and `1` when it has any
- when the log file doesn't exist, it prints `logscan: no such file: ` followed by the path to **standard error**, prints nothing to standard output, and exits with code `2`

With `--level`, it keeps exiting with `0`.

## Concept

This is the same convention `grep` follows: `0` when it found something, `1` when it found nothing, and `2` when something went wrong, like a missing file. Programs that follow a convention like this can be chained with `&&`, which runs the next command only if the previous one exited with `0`:

```bash
python3 logscan/logscan.py logs/relay.log && echo "no faults"
```

Opening a file that doesn't exist raises `FileNotFoundError`. Catch it with `try` and `except`, as you did in Kestrel Ridge, and print your own message instead:

```python
try:
    log = open(path)
except FileNotFoundError:
    print(f"logscan: no such file: {path}", file=sys.stderr)
    sys.exit(2)
```

Error messages go to standard error, so redirecting the normal output to a file never fills it with complaints. Starting the message with the program's name tells the reader which program is complaining. That matters in a pipeline.

## Hints

1. Import `sys` for `sys.stderr` and `sys.exit`.
2. Wrap the `with open(...)` in `try`/`except FileNotFoundError`, and in the except block print the message to `sys.stderr` and exit with `2`.
3. After printing the counts, `sys.exit(1)` if `counts["FAULT"]` is more than 0. Test both logs: `logs/relay.log` and `logs/quiet.log`, and check each with `echo $?`.

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
open("logs/quiet.log", "w").write("".join(line + "\n" for line in lines[:40] if " FAULT " not in line))
EOF
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
```

## Checks

```python
faulty = run("python3 logscan/logscan.py logs/relay.log")
expect("Counting logs/relay.log prints the counts", faulty.out, "INFO 517\nWARN 66\nFAULT 17\n")
expect("A log with faults exits with code 1", faulty.code, 1, "sys.exit(1) after printing the counts, when there are faults.")
quiet = run("python3 logscan/logscan.py logs/quiet.log")
expect("A log without faults exits with code 0", quiet.code, 0, "Only exit with 1 when the FAULT count is more than 0.")
missing = run("python3 logscan/logscan.py logs/missing.log")
expect(
    "A missing log prints one line to standard error",
    missing.err,
    "logscan: no such file: logs/missing.log\n",
    "Catch FileNotFoundError and print the message with file=sys.stderr.",
)
expect("A missing log prints nothing to standard output", missing.out, "")
expect("A missing log exits with code 2", missing.code, 2, "sys.exit(2) after printing the message.")
```

## Hidden checks

```python
expect(
    "--level still exits with code 0",
    lambda: run("python3 logscan/logscan.py logs/relay.log --level FAULT > /dev/null").code,
    0,
    "Only counting exits with 1 for faults.",
)
```

## Solution

```bash
cat > logscan/logscan.py <<'EOF'
# logscan: summarizes a relay log.
import argparse
import sys

parser = argparse.ArgumentParser(description="Summarize a relay log.")
parser.add_argument("logfile", help="the log to read")
parser.add_argument("--level", help="print only the lines at this level")
args = parser.parse_args()

counts = {"INFO": 0, "WARN": 0, "FAULT": 0}
try:
    with open(args.logfile) as log:
        for line in log:
            level = line.split()[2]
            if args.level is None:
                counts[level] += 1
            elif level == args.level:
                print(line, end="")
except FileNotFoundError:
    print(f"logscan: no such file: {args.logfile}", file=sys.stderr)
    sys.exit(2)
if args.level is None:
    for level, count in counts.items():
        print(level, count)
    if counts["FAULT"] > 0:
        sys.exit(1)
EOF
python3 logscan/logscan.py logs/quiet.log && echo "no faults"
```

## Restored

The watchdog reads `logscan`'s exit code every hour now, and the night shift sees one plain sentence when a log goes missing.
