---
id: keep-it-straight
kind: terminal
title: Keep it straight
system: Straight lines
symbol: controller
scene: repo
repo: ~/tools
skills: branches
---

## Briefing

The ridge would like `main`'s history to read as one straight line, with no merge commits: easy to follow, one change after another. `add-uptime` is ready to go in, but it started from an older `main`, so merging it as it is would make a merge commit.

## Objective

Bring `add-uptime` into `main` in `~/tools` without a merge commit. Afterwards, `main` should have the uptime report on top of everything it had before.

## Concept

Merge and rebase both bring work together. They differ in the history they leave:

- **Merge** keeps the history as it really happened: lines that split and join again, with merge commits.
- **Rebase** rewrites your branch's commits so the history is a straight line, as if the work happened one piece after another.

Combine them. Rebase your branch onto `main`, and `main` becomes the start of your branch's history, so merging it is a fast-forward:

```bash
git switch add-uptime
git rebase main
git switch main
git merge --ff-only add-uptime
```

`--ff-only` makes the merge refuse unless it can fast-forward, so you can't make a merge commit by accident.

Only rebase commits nobody else has. Rebasing replaces commits with new ones, and anyone who had the old ones ends up with two versions of the same work. Rebase your own branch before you share it, and never rebase `main` or any branch other people use.

## Hints

1. Rebase `add-uptime` onto `main` first, as in the last mission.
2. Then switch to `main` and merge `add-uptime` with `--ff-only`.
3. `git log --oneline --graph` on `main` should be a single straight line.

## Setup

```bash
player_git
mkdir tools
cd tools
git init -q
cat > beacon.py <<'EOF'
# beacon.py: sets the ridge beacon's frequency and power.
FREQUENCY = "147.360"
POWER = 40

print(f"beacon on {FREQUENCY} MHz at {POWER}% power")
EOF
cat > status.py <<'EOF'
# status.py: prints the relay's status.
print("KR-RELAY-1 online")
EOF
printf 'Morning checks\n- beacon lamp\n- relay heartbeat\n- antenna guy wires\n' > checklist.txt
git add .
commit_as Ranger "2026-11-16 08:00" "Add the ridge tools"
sed -i 's/147.360/147.330/' beacon.py
git add beacon.py
commit_as Ranger "2026-11-16 08:40" "Fix the beacon frequency"
echo '- antenna current' >> checklist.txt
git add checklist.txt
commit_as Ranger "2026-11-16 09:30" "Add the antenna current check"
git switch -q -c add-uptime HEAD~1
printf 'import time\n\nprint(f"up since {time.ctime()}")\n' > uptime.py
git add uptime.py
commit_as Ranger "2026-11-17 08:10" "Add the uptime report"
git switch -q main
sed -i 's/POWER = 40/POWER = 55/' beacon.py
git add beacon.py
commit_as Ranger "2026-11-17 09:00" "Raise the beacon power"
```

## Checks

```python
expect(
    "main has the uptime report on top",
    lambda: [c["message"] for c in commits("~/tools", "main")][:3],
    ["Add the uptime report", "Raise the beacon power", "Add the antenna current check"],
    "Rebase add-uptime onto main, then fast-forward main to it.",
)
check(
    "main's history is a straight line",
    lambda: all(len(c["parents"]) <= 1 for c in commits("~/tools", "main")),
    "There's a merge commit on main. Start over, and rebase add-uptime before merging it.",
)
check("main and add-uptime are at the same commit", lambda: rev("~/tools", "main") == rev("~/tools", "add-uptime"))
```

## Solution

```bash
cd tools
git switch add-uptime
git rebase main
git switch main
git merge --ff-only add-uptime
git --no-pager log --oneline --graph
```

## Restored

`main` reads top to bottom as one line: the uptime report, the louder beacon, the antenna check. No knots to untangle.
