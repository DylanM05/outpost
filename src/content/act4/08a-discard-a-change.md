---
id: discard-a-change
kind: terminal
title: Discard a change
system: Recovery bench
symbol: instrument
scene: repo
repo: ~/tools
skills: undoing
---

## Briefing

You've been editing two files in `~/tools`. The new line in `checklist.txt` is right. `beacon.py` went badly: you typed into the wrong window, and it's full of nonsense. You haven't committed either.

## Objective

Throw away your changes to `beacon.py`, so it's back as it was in the last commit. Keep the change to `checklist.txt`.

## Concept

`git restore` puts a file back the way it was in the last commit, throwing away the changes you've made to it since:

```bash
git restore beacon.py
```

Check what you're throwing away first, with `git diff beacon.py`, because those changes are gone for good. They were never committed, so Git never had a copy of them. Other files' changes aren't touched.

`git restore` can also bring back a file from any commit, not just the last one, with `--source`: `git restore --source 289f7d6 beacon.py`. Older guides use `git checkout -- beacon.py` for the same job.

## Hints

1. `git status` lists both changed files. `git diff beacon.py` shows the damage.
2. Name only `beacon.py`, so the checklist keeps its change.
3. Run `git restore beacon.py`, then `git status` again.

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
sed -i 's/POWER = 40/POWER = 4000/' beacon.py
printf 'jjjjkkkk:wq\n:q!\n' >> beacon.py
echo '- guy wire tension' >> checklist.txt
```

## Checks

```python
check(
    "beacon.py is back as it was committed",
    lambda: read("~/tools/beacon.py") == show("~/tools", "HEAD", "beacon.py"),
    "Run git restore beacon.py.",
)
check(
    "Your checklist change is still there",
    lambda: "guy wire tension" in (read("~/tools/checklist.txt") or "") and "checklist.txt" in changed("~/tools"),
    "Restore only beacon.py. Start over to get the checklist change back.",
)
expect("Nothing was committed", lambda: rev("~/tools"), "daaf21228a28f6cbbc07df053ff03bda8d0033f5", reveal=False)
```

## Solution

```bash
cd tools
git diff beacon.py
git restore beacon.py
git status
```

## Restored

The nonsense is gone from `beacon.py`, and the checklist keeps its new line. You threw away exactly what you meant to, and nothing more.
