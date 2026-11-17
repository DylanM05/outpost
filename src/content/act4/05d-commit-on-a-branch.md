---
id: commit-on-a-branch
kind: terminal
title: Commit on a branch
system: Branch lines
symbol: instrument
scene: repo
repo: ~/tools
skills: branches
---

## Briefing

You're on `retune-beacon`. Try the louder beacon there, commit it, then go back to `main` and see what the ridge's version looks like while the experiment waits on its branch.

## Objective

1. On `retune-beacon`, change `POWER` in `beacon.py` from `40` to `55`, and commit it with the message `Raise the beacon power`.
2. Switch back to `main`.

## Concept

A commit goes on the branch you're on. `retune-beacon` moves forward to your new commit, and `main` stays exactly where it was.

Switching branches changes the files in the folder to match the branch you switch to:

```bash
git switch main
cat beacon.py
```

On `main`, `beacon.py` says `POWER = 40` again. Switch back to `retune-beacon` and it says `55`. Nothing is lost: each branch's version is safe in its commits, and switching just shows you a different one.

Git won't switch if you have uncommitted changes that switching would overwrite. It stops and tells you, so commit them first.

## Hints

1. Edit `beacon.py` with `nano`, then `git add` and `git commit` it as usual.
2. `git status` should say `On branch retune-beacon` before you commit.
3. After committing, run `git switch main` and `cat beacon.py`.

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
git switch -q -c retune-beacon
```

## Checks

```python
expect(
    "retune-beacon has your commit",
    lambda: latest("~/tools", "retune-beacon")["message"],
    "Raise the beacon power",
    "Commit on retune-beacon, with git commit -m.",
)
check(
    "It raises the power to 55",
    lambda: "POWER = 55" in (show("~/tools", "retune-beacon", "beacon.py") or ""),
    "Change POWER = 40 to POWER = 55 in beacon.py, and commit that.",
)
expect(
    "main hasn't moved",
    lambda: rev("~/tools", "main"),
    "daaf21228a28f6cbbc07df053ff03bda8d0033f5",
    "Commit on retune-beacon, not on main. Start over to try again.",
    reveal=False,
)
expect("The repository is back on main", lambda: branch("~/tools"), "main", "Switch back with git switch main.")
check("beacon.py shows main's version", lambda: "POWER = 40" in (read("~/tools/beacon.py") or ""), "Switching to main puts main's beacon.py back.")
```

## Solution

```bash
cd tools
# Players edit with nano; sed makes the same change.
sed -i 's/POWER = 40/POWER = 55/' beacon.py
git add beacon.py
git commit -m "Raise the beacon power"
git switch main
cat beacon.py
```

## Restored

The louder beacon is saved on `retune-beacon`, and the ridge's `main` still runs at forty. You can test one without risking the other.
