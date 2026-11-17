---
id: fast-forward
kind: terminal
title: Fast-forward
system: Merge desk
symbol: equipment
scene: repo
repo: ~/tools
skills: branches
---

## Briefing

The louder beacon on `retune-beacon` worked: the valley heard the ridge clearly all night. It's time for the ridge's real version, `main`, to have it too.

## Objective

Merge `retune-beacon` into `main` in `~/tools`.

## Concept

**Merging** brings the commits from another branch into the branch you're on. Switch to the branch that should receive the work, then name the branch to bring in:

```bash
git switch main
git merge retune-beacon
```

Since `retune-beacon` started, nobody has committed anything on `main`. Its history is simply the start of `retune-beacon`'s, so there's nothing to combine: Git moves `main` forward to `retune-beacon`'s latest commit, and says `Fast-forward`. No new commit is needed, and afterwards both branches point at the same commit.

Watch the panel as you do it: the `main` label jumps forward to join `retune-beacon`.

## Hints

1. Be on `main` first: the branch you're on is the one that changes.
2. Run `git merge retune-beacon` inside `~/tools`.
3. `git log --oneline` shows `Raise the beacon power` on `main` afterwards.

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
sed -i 's/POWER = 40/POWER = 55/' beacon.py
git add beacon.py
commit_as Ranger "2026-11-17 07:30" "Raise the beacon power"
git switch -q main
```

## Checks

```python
expect("The repository is on main", lambda: branch("~/tools"), "main", "Switch to main before merging.")
check(
    "main has the beacon change",
    lambda: rev("~/tools", "main") == rev("~/tools", "retune-beacon") != None,
    "Run git merge retune-beacon while on main.",
)
expect(
    "main fast-forwarded, with no merge commit",
    lambda: len(latest("~/tools", "main")["parents"]),
    1,
    "Here Git can just move main forward. Start over, and merge without --no-ff.",
)
check("beacon.py on main has the louder power", lambda: "POWER = 55" in (read("~/tools/beacon.py") or ""))
```

## Solution

```bash
cd tools
git switch main
git merge retune-beacon
```

## Restored

`main` moved forward to the louder beacon. The ridge's real version has it now, and there's still only one line of history.
