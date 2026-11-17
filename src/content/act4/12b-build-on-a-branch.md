---
id: build-on-a-branch
kind: terminal
title: Build on a branch
system: Logscan's repository
symbol: equipment
scene: repo
repo: ~/logscan
skills: branches, remotes
---

## Briefing

The valley would like `logscan` to finish with a total: how many lines it read altogether. It's a small change, but `logscan` runs everywhere now, so it goes on a branch for Ines to review, not straight onto `main`.

## Objective

In `~/logscan`:

1. Make a branch named `total-line`, and switch to it.
2. Change `logscan.py` to print one more line after the counts, the total of all of them, as `TOTAL 600` for `sample.log`.
3. Commit it with the message `Print a total line`, and push the branch to the archive, setting its upstream.

Leave `main` as it is.

## Concept

This is the everyday shape of work in Git:

```bash
git switch -c total-line
nano logscan.py
python3 logscan.py sample.log
git add logscan.py
git commit -m "Print a total line"
git push -u origin total-line
```

Branch, change, test, commit, push. Test before you commit, so the commit is something that works.

`counts` is a dictionary of the three counts, so their total is `sum(counts.values())`. Print it inside `if args.level is None:`, straight after the `for` loop that prints the counts, so it comes last, and only when `logscan` is counting.

```text
INFO 517
WARN 66
FAULT 17
TOTAL 600
```

## Hints

1. `git switch -c total-line`, then open `logscan.py` in `nano`.
2. After the loop that prints each level, add `print("TOTAL", sum(counts.values()))`, indented to line up with the `for`.
3. Run `python3 logscan.py sample.log` to see the total, then commit and `git push -u origin total-line`.

## Root setup

```bash
mkdir -p /srv/archive
chown ranger:ranger /srv/archive
```

## Setup

```bash
player_git
mkdir logscan
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
cat > logscan/README.md <<'EOF'
# logscan

Summarizes a relay log: how many lines there are at each level.

    logscan relay.log
    grep KR-RELAY-4 relay.log | logscan
    logscan --level FAULT relay.log
EOF
python3 - <<'EOF'
messages = {"INFO": "heartbeat ok", "WARN": "signal weak", "FAULT": "antenna current out of range"}
lines = []
for i in range(600):
    relay = f"KR-RELAY-{1 + (i * 7) % 6}"
    level = "FAULT" if i % 37 == 5 else "WARN" if i % 9 == 4 else "INFO"
    minute = 360 + i * 2
    lines.append(f"{minute // 60 % 24:02d}:{minute % 60:02d} {relay} {level} {messages[level]}")
open("logscan/sample.log", "w").write("\n".join(lines) + "\n")
EOF
python3 -m py_compile logscan/logscan.py
git init -q --bare /srv/archive/logscan.git
cd logscan
git init -q
printf '__pycache__/\n*.log\n' > .gitignore
git add .
commit_as Ranger "2026-11-17 13:00" "Add logscan"
git remote add origin /srv/archive/logscan.git
git push -q -u origin main
```

## Checks

```python
ARCHIVE = "/srv/archive/logscan.git"
def summary(ref, arguments=""):
    # Runs logscan.py as the archive's ref has it, on a small log of its own.
    with open("/tmp/check.log", "w") as log:
        log.write("07:00 KR-A INFO ok\n07:02 KR-B WARN weak\n07:04 KR-C FAULT lost\n07:06 KR-A INFO ok\n")
    program = show(ARCHIVE, ref, "logscan.py")
    if program is None:
        return None
    with open("/tmp/check-logscan.py", "w") as file:
        file.write(program)
    return run(f"python3 /tmp/check-logscan.py {arguments} /tmp/check.log", "/tmp").out

check("The archive has total-line", lambda: "total-line" in branches(ARCHIVE), "Push the branch with git push -u origin total-line.")
expect(
    "Its commit",
    lambda: latest(ARCHIVE, "total-line")["message"],
    "Print a total line",
)
expect(
    "logscan prints a total after the counts",
    lambda: summary("total-line"),
    "INFO 2\nWARN 1\nFAULT 1\nTOTAL 4\n",
    "Print the total after the loop that prints the counts.",
)
expect(
    "The archive's main hasn't changed",
    lambda: [c["message"] for c in commits(ARCHIVE, "main")],
    ["Add logscan"],
    "Commit on total-line, not main. Start over to try again.",
)
expect("total-line's upstream is set", lambda: config("branch.total-line.remote", "~/logscan"), "origin", "Push with -u.")
```

## Hidden checks

```python
expect(
    "--level still prints only the matching lines",
    lambda: summary("total-line", "--level FAULT"),
    "07:04 KR-C FAULT lost\n",
    "Print the total inside if args.level is None:, so --level output doesn't change.",
)
```

## Solution

```bash
cd logscan
git switch -c total-line
# Players edit with nano; sed adds the same line.
sed -i 's/^        print(level, count)$/        print(level, count)\n    print("TOTAL", sum(counts.values()))/' logscan.py
python3 logscan.py sample.log
git add logscan.py
git commit -m "Print a total line"
git push -u origin total-line
```

## Restored

`total-line` is in the archive, with a change Ines can read in a minute, tested before it was committed. `main` stays as every relay knows it until she's happy.
