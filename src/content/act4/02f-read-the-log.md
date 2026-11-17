---
id: read-the-log
kind: terminal
title: Read the log
system: Ridge toolkit
symbol: equipment
scene: repo
repo: ~/valley-beacon
skills: git-history
---

## Briefing

To show the ridge what a history is good for, the valley has sent a copy of the repository for its own beacon program, into `~/valley-beacon`. Five people have worked on it since September. This winter the valley's beacon went quiet, and the valley wants to know who turned its power down, to ask them why.

## Objective

Use `git log` in `~/valley-beacon` to find out who lowered the beacon's power, and report their name.

## Concept

`git log` lists a repository's commits, newest first:

```text
commit 2d9e4c1a7b0f3e8d5c6a9b2f1e4d7c0a3b6e9f2d
Author: Ines Varga <ines@valley.archive>
Date:   Sun Sep 14 10:02:00 2026 +0000

    Add the valley beacon program
```

Each commit shows its **hash**, the long name Git gives it, then who made it, when, and its message. This is why good messages matter: the log is how people find their way around a project's past.

A log longer than the terminal opens in `less`. Space shows the next page, `b` goes back, and `q` quits.

## Hints

1. Run `git log` inside `~/valley-beacon`.
2. Look for the commit whose message is about the beacon's power.
3. The name on its `Author:` line is the answer.

## Setup

```bash
player_git
mkdir valley-beacon
cd valley-beacon
git init -q
cat > beacon.py <<'EOF'
# The valley beacon.
FREQUENCY = "147.390"
POWER = 50

print(f"valley beacon on {FREQUENCY} at {POWER}% power")
EOF
git add beacon.py
commit_as "Ines Varga" "2026-09-14 10:02" "Add the valley beacon program"
sed -i 's/147.390/147.330/' beacon.py
git add beacon.py
commit_as "Tomas Reid" "2026-09-20 16:45" "Move the beacon to 147.330"
sed -i 's/POWER = 50/POWER = 20/' beacon.py
git add beacon.py
commit_as "Mara Okafor" "2026-10-03 07:30" "Lower the beacon power for winter"
sed -i 's/at {POWER}%/at {POWER} percent/' beacon.py
git add beacon.py
commit_as "Pell Hansen" "2026-10-11 13:15" "Spell out percent in the beacon message"
echo 'open("beacon.log", "a").write(f"{FREQUENCY} {POWER}\n")' >> beacon.py
git add beacon.py
commit_as "Tomas Reid" "2026-10-28 09:50" "Log every beacon change"
```

## Report

Who lowered the beacon's power?

```text
Mara Okafor
```

## Checks

```python
check("You read the history with git log", lambda: git_calls("log"), "Run git log inside ~/valley-beacon.")
expect(
    "You reported who lowered the power",
    answer().lower(),
    "mara okafor",
    "Find the commit about the beacon's power, and read its Author line.",
    accept=lambda name: name in ("mara okafor", "mara", "okafor"),
    reveal=False,
)
```

## Solution

```bash
cd valley-beacon
# Players run git log; the tests can't press q to leave less.
git --no-pager log
```

## Restored

Mara Okafor, on the third of October, "for winter". The valley knows who to ask, and the log says why she did it before anyone has to.
