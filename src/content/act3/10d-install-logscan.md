---
id: install-logscan
kind: terminal
title: Install logscan
system: Log scanner
symbol: equipment
scene: files
skills: programs, streams
---

## Briefing

`logscan` is nearly a real tool. Two things are missing: it can't sit in a pipeline, because it only reads files, and running it still means typing `python3 logscan/logscan.py`. The crew wants to type `logscan`, like any other command.

Here's `logscan` as the last job left it. `~/bin` is already on the `PATH` in `~/.bashrc`.

## Objective

1. Make the log argument optional: when no file is given, `logscan.py` reads standard input instead.
2. Install it as a command named `logscan`: add a shebang, make it executable, and copy it to `~/bin/logscan`, without the `.py`.
3. Use it in a pipeline: `grep KR-RELAY-4 logs/relay.log | logscan`.

## Concept

To make a positional argument optional, give it `nargs="?"`. Then it's `None` when it's left out:

```python
parser.add_argument("logfile", nargs="?", help="the log to read (default: standard input)")
```

`sys.stdin` can be looped over just like an open file, so the counting loop doesn't need to change. Only the choice of where the lines come from does:

```python
if args.logfile is None:
    lines = sys.stdin
else:
    lines = open(args.logfile)
```

Installing a program means putting an executable copy of it in a folder on the `PATH`. Its name doesn't need an extension: the shebang line tells the system what runs it, which is why `ls` isn't called `ls.exe`. Keep editing `logscan/logscan.py`, and copy it to `~/bin/logscan` again whenever you change it.

## Hints

1. Add `nargs="?"` to `logfile`, and choose `sys.stdin` or the opened file based on whether `args.logfile` is `None`. Keep the `FileNotFoundError` handling around the `open`.
2. Add `#!/usr/bin/env python3` as the first line, then `chmod +x logscan/logscan.py` and `cp logscan/logscan.py ~/bin/logscan`.
3. Run `grep KR-RELAY-4 logs/relay.log | logscan`, and try `logscan --help` from any folder.

## Setup

```bash
mkdir -p logs logscan bin
echo 'export PATH="$HOME/bin:$PATH"' >> .bashrc
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
```

## Checks

```python
found = run("bash -lic 'command -v logscan' 2>/dev/null").out.strip()
expect("logscan is a command", found, "/home/ranger/bin/logscan", "Copy the program to ~/bin/logscan, with no .py on the end.")
check("~/bin/logscan is executable", lambda: "x" in mode("~/bin/logscan")[:3], "chmod +x before copying, or on the copy.")
piped = run("grep KR-RELAY-4 logs/relay.log | ~/bin/logscan")
expect(
    "grep KR-RELAY-4 logs/relay.log | logscan",
    piped.out,
    "INFO 97\nWARN 0\nFAULT 3\n",
    "With no file argument, read the lines from sys.stdin." if piped.err.strip() == "" else f"It reported: {piped.err.strip().splitlines()[-1]}",
)
expect("Reading a file still works", lambda: run("~/bin/logscan logs/relay.log").out, "INFO 517\nWARN 66\nFAULT 17\n")
check(
    "You ran logscan in a pipeline",
    lambda: any("|" in line and "logscan" in [program for program, _ in _parse(line)] for line in history()),
    "Run grep KR-RELAY-4 logs/relay.log | logscan.",
)
```

## Hidden checks

```python
expect(
    "--level works on standard input",
    lambda: run("~/bin/logscan --level WARN", input="07:00 KR-A INFO ok\n07:02 KR-B WARN signal weak\n").out,
    "07:02 KR-B WARN signal weak\n",
)
expect(
    "A missing file still exits with code 2",
    lambda: run("~/bin/logscan logs/missing.log").code,
    2,
)
```

## Solution

```bash
cat > logscan/logscan.py <<'EOF'
#!/usr/bin/env python3
# logscan: summarizes a relay log.
import argparse
import sys

parser = argparse.ArgumentParser(description="Summarize a relay log.")
parser.add_argument("logfile", nargs="?", help="the log to read (default: standard input)")
parser.add_argument("--level", help="print only the lines at this level")
args = parser.parse_args()

counts = {"INFO": 0, "WARN": 0, "FAULT": 0}
try:
    lines = sys.stdin if args.logfile is None else open(args.logfile)
except FileNotFoundError:
    print(f"logscan: no such file: {args.logfile}", file=sys.stderr)
    sys.exit(2)
for line in lines:
    level = line.split()[2]
    if args.level is None:
        counts[level] += 1
    elif level == args.level:
        print(line, end="")
if args.level is None:
    for level, count in counts.items():
        print(level, count)
    if counts["FAULT"] > 0:
        sys.exit(1)
EOF
chmod +x logscan/logscan.py
cp logscan/logscan.py ~/bin/logscan
source ~/.bashrc
grep KR-RELAY-4 logs/relay.log | logscan
```

## Restored

`logscan` is installed. It reads files or pipes, explains itself with `--help`, and reports through its exit code. The crew adds it to every relay on the line.
