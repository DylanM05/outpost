---
id: clean-up-the-branches
kind: terminal
title: Clean up the branches
system: Merge desk
symbol: equipment
scene: repo
repo: ~/tools
skills: branches
---

## Briefing

`retune-beacon` and `heartbeat-check` are both merged into `main`, but their names are still around, and the list of branches is getting long. Pell's `old-antenna` branch isn't merged: Pell still hasn't decided whether it's needed, and it has to stay.

## Objective

In `~/tools`, delete the branches that are already merged into `main`. Keep `old-antenna`.

## Concept

Once a branch is merged, its commits are part of `main`'s history. The branch's name points at commits `main` already has, so you can delete it without losing anything:

```bash
git branch -d retune-beacon
```

`-d` only deletes a branch that's merged. If a branch has commits nothing else leads to, Git refuses and tells you, because deleting the name would leave those commits with no way to find them. `-D` deletes it anyway, and that's how work gets lost, so don't reach for it unless you mean it.

To see which branches are safe to delete, ask Git which are merged into the one you're on:

```bash
git branch --merged
```

## Hints

1. Run `git branch --merged` on `main`. Every branch it lists, apart from `main` itself, can go.
2. Delete each one with `git branch -d`.
3. `git branch -d old-antenna` refuses, because it isn't merged. That's the one to keep.

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
git switch -q -c old-antenna HEAD~2
echo '- old antenna mount' >> checklist.txt
git add checklist.txt
commit_as "Pell Hansen" "2026-11-16 10:40" "Check the old antenna mount"
git switch -q main
git switch -q -c retune-beacon
sed -i 's/POWER = 40/POWER = 55/' beacon.py
git add beacon.py
commit_as Ranger "2026-11-17 07:30" "Raise the beacon power"
git switch -q main
git merge -q retune-beacon
git switch -q -c heartbeat-check
echo 'print("heartbeat every 60 seconds")' >> status.py
git add status.py
commit_as "Tomas Reid" "2026-11-17 10:15" "Print the heartbeat interval"
echo 'print("last heartbeat: just now")' >> status.py
git add status.py
commit_as "Tomas Reid" "2026-11-17 10:50" "Print the last heartbeat"
git switch -q main
as_crew Ranger "2026-11-17 11:45" git merge -q --no-edit heartbeat-check
```

## Checks

```python
expect(
    "Only main and old-antenna are left",
    lambda: branches("~/tools"),
    ["main", "old-antenna"],
    "Delete each branch git branch --merged lists, except main.",
)
expect(
    "old-antenna still has Pell's commit",
    lambda: latest("~/tools", "old-antenna")["message"],
    "Check the old antenna mount",
    "Start over to get old-antenna back, and only delete merged branches.",
)
check(
    "main still has both merged changes",
    lambda: "POWER = 55" in (show("~/tools", "main", "beacon.py") or "") and "last heartbeat" in (show("~/tools", "main", "status.py") or ""),
)
```

## Solution

```bash
cd tools
git branch --merged
git branch -d retune-beacon
git branch -d heartbeat-check
git branch
```

## Restored

Two branch names gone, not a single commit lost. `old-antenna` waits for Pell's decision.
