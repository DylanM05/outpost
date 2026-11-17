---
id: version-logscan
kind: terminal
title: Version logscan
system: Logscan's repository
symbol: equipment
scene: repo
repo: ~/logscan
skills: commits, remotes
---

## Briefing

`logscan`, the log scanner you built on the relay line, runs on every relay now, and every relay has its own copy, with no history. The valley wants it in the archive, where changes can be reviewed and every station gets the same version. The archive has made an empty repository for it.

Here's everything you need, one step after another.

## Objective

1. Make `~/logscan` a repository.
2. Ignore Python's cache and log files, with a `.gitignore`.
3. Commit everything else, with the message `Add logscan`.
4. Add the archive's empty repository, `/srv/archive/logscan.git`, as `origin`, and push `main` to it, setting its upstream.

## Concept

This is how every project starts its life in Git, in order:

```bash
git init
nano .gitignore
git add .
git status
git commit -m "Add logscan"
git remote add origin /srv/archive/logscan.git
git push -u origin main
```

Check `git status` before the first commit. With the `.gitignore` in place, `git add .` should have staged only the files that belong: here, `.gitignore`, `README.md`, and `logscan.py`.

The archive's repository is empty, so it has no `main` yet. Push it the way you pushed a new branch in Share a branch, with `-u`, so that from then on a plain `git push` and `git pull` know where to go.

## Hints

1. Inside `~/logscan`, run `git init`, then write `__pycache__/` and `*.log` on two lines of `.gitignore`.
2. `git add .`, then `git status`: only the three files should be staged. Then commit.
3. `git remote add origin /srv/archive/logscan.git`, then `git push -u origin main`.

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
```

## Checks

```python
ARCHIVE = "/srv/archive/logscan.git"
check("~/logscan is a repository", lambda: is_repo("~/logscan"), "Run git init inside ~/logscan.")
expect(
    "The commit has logscan's files and nothing else",
    lambda: tracked("~/logscan"),
    [".gitignore", "README.md", "logscan.py"],
    "Ignore __pycache__/ and *.log before staging. Before the first commit, git rm --cached unstages a file.",
)
expect("Its message", lambda: latest("~/logscan")["message"], "Add logscan")
check(
    "The archive has your main",
    lambda: rev(ARCHIVE, "main") == rev("~/logscan", "main") != None,
    "Add the archive as origin, then git push -u origin main.",
)
expect(
    "main's upstream is set",
    lambda: config("branch.main.remote", "~/logscan"),
    "origin",
    "Push with -u the first time.",
)
```

## Solution

```bash
cd logscan
git init
printf '__pycache__/\n*.log\n' > .gitignore
git add .
git status
git commit -m "Add logscan"
git remote add origin /srv/archive/logscan.git
git push -u origin main
```

## Restored

`logscan` is in the archive, with a history of one commit. Every relay can clone the same version now, and every change from here on will be in the log.
