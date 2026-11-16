---
id: count-the-levels
kind: terminal
title: Count the levels
system: Log scanner
symbol: equipment
scene: files
skills: programs, streams
---

## Briefing

The crew has run the same `grep` and `wc` commands on the relay logs so often that it's time for a proper tool. Over the next few jobs you'll build `logscan`, a command that summarizes a relay log. It starts the way every tool does: read the file, and count.

Every line of a relay log has the same shape, and the third word is the line's **level**: `INFO`, `WARN`, or `FAULT`.

```text
06:14 KR-RELAY-3 WARN signal weak
```

## Objective

Finish `~/logscan/logscan.py`. Given the path to a log as its first argument, it reads the file and prints how many lines there are at each level, in this order, always all three:

```text
INFO 517
WARN 66
FAULT 17
```

That's the output for `python3 logscan/logscan.py logs/relay.log`.

## Concept

Until now, your programs got text from their arguments or from standard input. `open()` reads a file by its path:

```python
with open(path) as log:
    for line in log:
        print(line.strip())
```

`open(path)` returns a file object. Looping over it gives one line at a time, each still ending in `\n`. The `with` block closes the file when the block ends, even if an error happens inside it.

To read the whole file as one string instead, call `log.read()`.

The path can be relative, and it's relative to the folder the program was *run* from, not the folder the program's file is in.

## Hints

1. Make a dictionary of counts that starts with all three levels at `0`, so a level with no lines still prints `0`.
2. For each line, the level is `line.split()[2]`. Add one to its count.
3. After the loop, print each level and its count, in the order INFO, WARN, FAULT.

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

# Open the file, count how many lines there are at each level, and print the
# counts: INFO, then WARN, then FAULT.
EOF
```

## Checks

```python
scan = run("python3 logscan/logscan.py logs/relay.log")
expect(
    "python3 logscan/logscan.py logs/relay.log",
    scan.out,
    "INFO 517\nWARN 66\nFAULT 17\n",
    "Print INFO, WARN, and FAULT with their counts, one per line." if scan.code == 0 else f"Python reported: {(scan.err.strip().splitlines() or ['nothing'])[-1]}",
)
```

## Hidden checks

```python
run("mkdir -p /tmp/scan && printf '07:00 KR-A INFO ok\\n07:02 KR-B INFO ok\\n07:04 KR-A WARN signal weak\\n' > /tmp/scan/quiet.log")
expect(
    "A log with no faults",
    lambda: run("python3 logscan/logscan.py /tmp/scan/quiet.log").out,
    "INFO 2\nWARN 1\nFAULT 0\n",
    "Every level is printed, even with a count of 0.",
)
```

## Solution

```bash
# A player writes the code in nano. printf writes the same program unattended.
printf '# logscan: summarizes a relay log.\n# Usage: python3 logscan.py LOGFILE\nimport sys\n\npath = sys.argv[1]\n\ncounts = {"INFO": 0, "WARN": 0, "FAULT": 0}\nwith open(path) as log:\n    for line in log:\n        counts[line.split()[2]] += 1\nfor level, count in counts.items():\n    print(level, count)\n' > logscan/logscan.py
python3 logscan/logscan.py logs/relay.log
```

## Restored

517 heartbeats, 66 warnings, 17 faults, in one command. `logscan` exists, and it already beats retyping three `grep`s.
