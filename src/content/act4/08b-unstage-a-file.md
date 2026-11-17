---
id: unstage-a-file
kind: terminal
title: Unstage a file
system: Recovery bench
symbol: instrument
scene: repo
repo: ~/tools
skills: undoing
---

## Briefing

You staged the beacon change ready to commit, and staged `radio.key` along with it by accident. That file holds the password for the ridge's radio, and it must never be committed: anything committed goes to the archive, and stays in the history for good. You still need the file itself.

## Objective

Take `radio.key` out of the staging area in `~/tools`, without deleting it. Leave `beacon.py` staged.

## Concept

`git restore --staged` takes a file back out of the staging area:

```bash
git restore --staged radio.key
```

It only changes what's staged. Your copy of the file stays exactly as it is. A new file becomes untracked again, and a changed file keeps its changes, just not staged.

`git status` reminds you of this: under "Changes to be committed", it suggests `git restore --staged <file>` to unstage.

Notice the difference from the last mission: plain `git restore` changes your *file*, and `--staged` changes only what's *staged*.

## Hints

1. `git status` shows both files under "Changes to be committed".
2. Name only `radio.key`.
3. Run `git restore --staged radio.key`, then `git status`.

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
sed -i 's/POWER = 40/POWER = 55/' beacon.py
printf 'KR-RIDGE radio password: amber-falcon-73\n' > radio.key
git add beacon.py radio.key
```

## Checks

```python
expect("Only beacon.py is staged", lambda: staged("~/tools"), ["beacon.py"], "Unstage radio.key with git restore --staged radio.key.")
check(
    "radio.key is still there, untracked",
    lambda: "amber-falcon-73" in (read("~/tools/radio.key") or "") and "radio.key" in untracked("~/tools"),
    "Unstage it rather than deleting it. Start over to get it back.",
)
expect("Nothing was committed", lambda: rev("~/tools"), "daaf21228a28f6cbbc07df053ff03bda8d0033f5", "Don't commit yet.", reveal=False)
```

## Solution

```bash
cd tools
git status
git restore --staged radio.key
git status
```

## Restored

The radio password stays on the ridge, out of the staging area and out of the archive. The beacon change waits, staged, for its commit.
