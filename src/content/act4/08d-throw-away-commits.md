---
id: throw-away-commits
kind: terminal
title: Throw away commits
system: Recovery bench
symbol: instrument
scene: repo
repo: ~/tools
skills: undoing
---

## Briefing

Pell Hansen tried to fix the beacon's range by turning it up, twice, and committed both tries on the ridge's `main`. Then Pell started a third try, and stopped halfway. The beacon now drowns out the valley's own radio. None of it has gone to the archive. Everything after `Add the antenna current check` has to go.

## Objective

Put `main` in `~/tools` back to the commit `Add the antenna current check`, throwing away the two commits after it and the uncommitted changes.

## Concept

`git reset --hard` moves the branch you're on to an earlier commit, like `--soft` does, and then makes the staging area and your files match that commit too:

```bash
git reset --hard daaf212
```

Everything after it is thrown away: the commits, anything staged, and every uncommitted change in your files.

That makes `--hard` the most dangerous everyday Git command. Uncommitted changes it throws away are gone for good. The commits it leaves behind aren't on any branch any more, so they won't show up in `git log`, and Git eventually deletes them. Before you run it, check with `git status` and `git log` that there's nothing you want to keep, and never use it on commits other people already have.

| Command | Branch moves | Staging area | Your files |
|---|---|---|---|
| `git reset --soft` | yes | kept | kept |
| `git reset --hard` | yes | reset | reset |

## Hints

1. `git log --oneline` shows the hash of `Add the antenna current check`.
2. `git status` shows the half-finished change that will be thrown away too.
3. Run `git reset --hard` with that hash, or with `HEAD~2`.

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
sed -i 's/POWER = 40/POWER = 90/' beacon.py
git add beacon.py
commit_as "Pell Hansen" "2026-11-17 01:10" "Try a louder beacon"
sed -i 's/POWER = 90/POWER = 150/' beacon.py
git add beacon.py
commit_as "Pell Hansen" "2026-11-17 01:40" "Try an even louder beacon"
sed -i 's/POWER = 150/POWER = 300/' beacon.py
echo 'BOOST = True' >> beacon.py
```

## Checks

```python
expect(
    "main is back at Add the antenna current check",
    lambda: rev("~/tools", "main"),
    "daaf21228a28f6cbbc07df053ff03bda8d0033f5",
    "Run git reset --hard with that commit's hash.",
    reveal=False,
)
expect("Nothing is left uncommitted", lambda: status("~/tools"), [], "--hard resets your files too.")
check("beacon.py is back at 40", lambda: "POWER = 40" in (read("~/tools/beacon.py") or ""))
```

## Solution

```bash
cd tools
git --no-pager log --oneline
git status
git reset --hard daaf212
```

## Restored

The ridge's `main` is back at the antenna check, at a sensible forty, with no trace of the night's experiments. The valley can hear its own radio again.
