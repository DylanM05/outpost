---
id: start-a-branch
kind: terminal
title: Start a branch
system: Branch lines
symbol: instrument
scene: repo
repo: ~/tools
skills: branches
---

## Briefing

The beacon is hard to hear in the valley this winter. You want to try raising its power, but the version on `main` is the one the ridge relies on, and you might change your mind. Do the experiment on a branch of its own.

## Objective

In `~/tools`, make a branch named `retune-beacon`, and switch to it.

## Concept

`git branch` with a name makes a new branch, pointing at the commit you're on:

```bash
git branch retune-beacon
```

That only makes the branch. `git switch` moves you onto it, so your next commit goes there:

```bash
git switch retune-beacon
```

`git switch -c` does both at once: it **c**reates the branch and switches to it. Older guides use `git checkout` and `git checkout -b` for the same jobs, and Git still understands them.

A branch really is just a name for a commit. Git keeps each one as a small file inside `.git/refs/heads`, holding one commit's hash, so making a branch is instant:

```bash
cat .git/refs/heads/main
cat .git/HEAD
```

`.git/HEAD` says which branch you're on, as `ref: refs/heads/main`.

## Hints

1. Run the commands inside `~/tools`.
2. Make the branch with `git branch`, then move onto it with `git switch`. Or do both with `git switch -c`.
3. Run `git switch -c retune-beacon`, then `git branch` to check.

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
```

## Checks

```python
check("retune-beacon exists", lambda: "retune-beacon" in branches("~/tools"), "Make it with git branch retune-beacon, or git switch -c retune-beacon.")
expect("The repository is on retune-beacon", lambda: branch("~/tools"), "retune-beacon", "Switch to it with git switch retune-beacon.")
check(
    "It starts from main's latest commit",
    lambda: rev("~/tools", "retune-beacon") == rev("~/tools", "main") == "daaf21228a28f6cbbc07df053ff03bda8d0033f5",
    "Make the branch while you're on main, before committing anything.",
)
```

## Solution

```bash
cd tools
git switch -c retune-beacon
git branch
cat .git/HEAD
```

## Restored

You're on `retune-beacon`. Whatever you commit now stays on this branch, and `main` waits where it was.
