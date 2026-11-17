---
id: merge-two-lines
kind: terminal
title: Merge two lines of work
system: Merge desk
symbol: equipment
scene: repo
repo: ~/tools
skills: branches
---

## Briefing

Tomas Reid has finished `heartbeat-check`: the status script now prints the heartbeat. Meanwhile you raised the beacon's power on `main`. Both changes are good, and both belong in the ridge's version.

## Objective

Merge `heartbeat-check` into `main` in `~/tools`, so `main` has both the louder beacon and the heartbeat.

## Concept

This time both branches have moved on since they split, so Git can't just move `main` forward: that would lose the commit `main` has. Instead it makes a **merge commit**, a new commit on `main` that brings both lines together. A merge commit has two parents, the latest commit of each branch, and its snapshot has both sets of changes.

```bash
git merge heartbeat-check
```

Git opens `nano` with a message ready, `Merge branch 'heartbeat-check'`. Save and exit (Ctrl+O, Enter, Ctrl+X) to accept it. Or skip the editor and take that message as it is with `--no-edit`:

```bash
git merge --no-edit heartbeat-check
```

In the graph, the two lines join at the merge commit.

Here the branches changed different files, so Git combines them by itself. When both change the same lines, Git can't know which version is right and stops with a **merge conflict** for you to sort out. That's for later in the archive.

## Hints

1. Make sure you're on `main`, then merge the other branch into it.
2. When `nano` opens, save and exit to keep the message Git wrote.
3. Run `git merge --no-edit heartbeat-check`, then look at the graph with `git log --oneline --graph`.

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
git switch -q -c heartbeat-check
echo 'print("heartbeat every 60 seconds")' >> status.py
git add status.py
commit_as "Tomas Reid" "2026-11-17 10:15" "Print the heartbeat interval"
echo 'print("last heartbeat: just now")' >> status.py
git add status.py
commit_as "Tomas Reid" "2026-11-17 10:50" "Print the last heartbeat"
git switch -q main
sed -i 's/POWER = 40/POWER = 55/' beacon.py
git add beacon.py
commit_as Ranger "2026-11-17 11:30" "Raise the beacon power"
```

## Checks

```python
expect("The repository is on main", lambda: branch("~/tools"), "main", "Merge into main: switch to main first.")
check(
    "main has a merge commit",
    lambda: latest("~/tools", "main")["parents"][1:] == [rev("~/tools", "heartbeat-check")],
    "Run git merge heartbeat-check while on main, and finish the merge by saving the message.",
)
check("main has the louder beacon", lambda: "POWER = 55" in (show("~/tools", "main", "beacon.py") or ""))
check("main has the heartbeat", lambda: "last heartbeat" in (show("~/tools", "main", "status.py") or ""))
expect("The merge is finished", lambda: status("~/tools"), [], "If nano is still open, save and exit it.")
```

## Solution

```bash
cd tools
git merge --no-edit heartbeat-check
git --no-pager log --oneline --graph
```

## Restored

Two lines of work, one merge commit, and `main` has both: a louder beacon and a status script that reports the heartbeat.
