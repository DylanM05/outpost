---
id: ship-the-feature
kind: terminal
title: Ship the feature
system: Logscan's repository
symbol: equipment
scene: repo
repo: ~/logscan
skills: branches, remotes
---

## Briefing

Ines has read `total-line`, and it's good. She's also pushed a change of her own to `main` in the meantime, explaining `logscan`'s exit codes in the README. The total can go in.

## Objective

In `~/logscan`:

1. Bring your `main` up to date with the archive's.
2. Merge `total-line` into `main`.
3. Push `main` to the archive.
4. Delete your `total-line` branch, now that it's merged.

## Concept

Finishing a branch is everything you've practised, in order:

```bash
git switch main
git pull
git merge total-line
git push
git branch -d total-line
```

Pull first, so you merge into the latest `main`, and the push goes through. Ines's commit means `main` has moved on since `total-line` started, so the merge makes a merge commit: save the message in `nano` when it opens, or use `--no-edit`.

The archive still has its copy of `total-line`. `git push origin --delete total-line` removes that too, once nobody needs it.

## Hints

1. `git switch main`, then `git pull`: Ines's commit arrives.
2. `git merge --no-edit total-line`, then `git push`.
3. `git branch -d total-line`, and `git log --oneline --graph` to see it all.

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
git switch -q -c total-line
sed -i 's/^        print(level, count)$/        print(level, count)\n    print("TOTAL", sum(counts.values()))/' logscan.py
git add logscan.py
commit_as Ranger "2026-11-17 14:00" "Print a total line"
git push -q -u origin total-line
cd
git clone -q /srv/archive/logscan.git /tmp/valley
cd /tmp/valley
printf '\nExits with 0 when all is well, 1 when the log has faults, and 2 when the log is missing.\n' >> README.md
git add README.md
commit_as "Ines Varga" "2026-11-17 15:10" "Explain the exit codes"
git push -q
cd
rm -rf /tmp/valley
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

messages = lambda: [c["message"] for c in commits(ARCHIVE, "main")]
check("The archive's main has the total line", lambda: "Print a total line" in messages(), "Merge total-line into main, then push.")
check("It still has Ines's commit", lambda: "Explain the exit codes" in messages(), "Pull before merging, and never force a push.")
expect(
    "logscan on main prints the total",
    lambda: summary("main"),
    "INFO 2\nWARN 1\nFAULT 1\nTOTAL 4\n",
)
check("Your main and the archive's match", lambda: rev("~/logscan", "main") == rev(ARCHIVE, "main"), "Push main after merging.")
expect("Only main is left in your repository", lambda: branches("~/logscan"), ["main"], "Delete total-line with git branch -d.")
```

## Solution

```bash
cd logscan
git switch main
git pull
git merge --no-edit total-line
git push
git branch -d total-line
git --no-pager log --oneline --graph
```

## Restored

The total line is on the archive's `main`, next to Ines's README. Every relay that pulls gets both, and the history shows exactly how they got there.
