---
id: see-what-changed
kind: terminal
title: See what changed
system: Ridge toolkit
symbol: equipment
scene: repo
repo: ~/tools
skills: commits
---

## Briefing

Overnight, someone on the night shift changed `beacon.py` and went to bed without committing it. The beacon is louder than it should be. Before you decide what to do about it, find out exactly what they changed.

## Objective

Use `git diff` to see what changed in `~/tools` since the last commit, and report what the beacon's power was in that commit.

## Concept

`git status` tells you *which* files have changed since the last commit. It lists them under "Changes not staged for commit". `git diff` shows *how* they changed:

```diff
diff --git a/beacon.py b/beacon.py
--- a/beacon.py
+++ b/beacon.py
@@ -1,5 +1,5 @@
 # beacon.py: sets the ridge beacon's frequency and power.
-FREQUENCY = "147.360"
+FREQUENCY = "147.390"
 POWER = 40
```

Read it line by line. A line starting with `-` was removed, and a line starting with `+` was added, so a changed line shows up as one of each: the old version, then the new one. Lines with neither are unchanged, shown for context. `@@ -1,5 +1,5 @@` says which lines of the file this part covers.

`git diff` compares your files with what's staged, so it shows the changes you haven't staged yet. A long diff opens in `less`; press `q` to quit.

## Hints

1. Run `git diff` inside `~/tools`.
2. Find the `-` line and the `+` line for `POWER`.
3. The `-` line is how it was in the last commit.

## Setup

```bash
player_git
mkdir tools
cat > tools/beacon.py <<'EOF'
# beacon.py: sets the ridge beacon's frequency and power.
FREQUENCY = "147.360"
POWER = 40

print(f"beacon on {FREQUENCY} MHz at {POWER}% power")
EOF
cat > tools/status.py <<'EOF'
# status.py: prints the relay's status.
print("KR-RELAY-1 online")
EOF
printf 'Morning checks\n- beacon lamp\n- relay heartbeat\n- antenna guy wires\n' > tools/checklist.txt
cd tools
git init -q
git add .
commit_as Ranger "2026-11-16 08:00" "Add the ridge tools"
sed -i 's/POWER = 40/POWER = 65/' beacon.py
```

## Report

What was the beacon's power in the last commit?

```text
40
```

## Checks

```python
check("You looked at the changes with git diff", lambda: git_calls("diff"), "Run git diff in ~/tools.")
expect(
    "You reported the power before the change",
    answer().rstrip("%"),
    "40",
    "Read the line starting with - next to POWER.",
    reveal=False,
)
```

## Solution

```bash
cd tools
git status
git diff
```

## Restored

Forty, now sixty-five. The night shift turned the beacon up. Now you know exactly what changed, you can decide whether to keep it.
