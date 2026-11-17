---
id: list-the-branches
kind: terminal
title: List the branches
system: Branch lines
symbol: instrument
scene: console
skills: branches
---

## Briefing

While the ridge's line was down, two valley technicians worked on `~/tools` over the relay, each trying out a change without touching the version the ridge relies on. They did it with **branches**. The terminal was left wherever the last of them finished, and before you change anything, you need to know where that is.

## Objective

List the branches in `~/tools`, and report which one the repository is on.

## Concept

A **branch** is a line of work in a repository. Every repository starts with one, called `main` here. Making another lets you try something out, commit as you go, and leave `main` exactly as it was until the work is ready.

Underneath, a branch is just a name for a commit. When you commit, the branch you're on moves forward to the new commit, and every other branch stays where it was.

Git calls where you are now **HEAD**. Usually, HEAD is a branch: the one your next commit will go on. `git branch` lists the branches, and marks HEAD's with `*`:

```text
  main
* night-shift
```

`git status` names it too, on its first line: `On branch night-shift`.

## Hints

1. Run `git branch` inside `~/tools`.
2. One branch has a `*` in front of it.
3. `git status` confirms it on its first line.

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
git switch -q -c heartbeat-check
echo 'print("heartbeat every 60 seconds")' >> status.py
git add status.py
commit_as "Tomas Reid" "2026-11-16 11:15" "Print the heartbeat interval"
```

## Report

Which branch is `~/tools` on?

```text
heartbeat-check
```

## Checks

```python
check("You listed the branches", lambda: git_calls("branch") or git_calls("status"), "Run git branch inside ~/tools.")
expect(
    "You reported the current branch",
    answer().lstrip("* "),
    "heartbeat-check",
    "Find the branch marked with *.",
    reveal=False,
)
```

## Solution

```bash
cd tools
git branch
```

## Restored

`heartbeat-check`, Tomas Reid's experiment with the heartbeat. Pell's `old-antenna` branch is there too, and `main` is just as the ridge left it.
