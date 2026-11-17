---
id: graph-the-history
kind: terminal
title: Graph the history
system: Branch lines
symbol: instrument
scene: console
skills: branches, git-history
---

## Briefing

Pell Hansen worked a night shift on the ridge's tools over the relay, and committed a check of the antenna current. Pell wants it reviewed, but can't remember which branch it went on, and `git log` on `main` doesn't show it.

## Objective

Show the history of every branch in `~/tools` as a graph, and report which branch has the commit `Check the antenna current at night`.

## Concept

`git log` shows the history of the branch you're on, and only that. A few options change what it shows:

| Option | Shows |
|---|---|
| `--all` | every branch, not just yours |
| `--oneline` | one line per commit: short hash and message |
| `--graph` | lines on the left showing how commits connect |

Together, they draw the whole repository:

```bash
git log --oneline --graph --all
```

```text
* 7f3c2e1 (HEAD -> main) Add the uptime report
| * 4b9d0a6 (heartbeat) Print the heartbeat
|/
* 2e8a1c5 Fix the beacon frequency
* 90d4b3f Add the ridge tools
```

Each `*` is a commit. The lines show which commit came before which: here, `heartbeat` split off from `main` after `Fix the beacon frequency`. Branch names appear in brackets next to the commit they point at, and `HEAD -> main` marks the branch you're on.

## Hints

1. Plain `git log` only shows `main`. Add `--all`.
2. Run `git log --oneline --graph --all` inside `~/tools`.
3. Find the commit, then follow its line up to the newest commit on it. The branch name is next to that one.

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
git switch -q -c night-shift HEAD~1
echo 'print("antenna current: check at night too")' >> status.py
git add status.py
commit_as "Pell Hansen" "2026-11-16 22:10" "Check the antenna current at night"
echo 'print("night readings logged")' >> status.py
git add status.py
commit_as "Pell Hansen" "2026-11-16 23:05" "Log the night readings"
git switch -q main
git switch -q -c retune-beacon
sed -i 's/POWER = 40/POWER = 55/' beacon.py
git add beacon.py
commit_as Ranger "2026-11-17 07:30" "Raise the beacon power"
git switch -q main
```

## Report

Which branch has the commit `Check the antenna current at night`?

```text
night-shift
```

## Checks

```python
check(
    "You graphed every branch",
    lambda: any("--all" in args.split() for args in git_calls("log")),
    "Run git log --oneline --graph --all.",
)
expect(
    "You reported the branch",
    answer(),
    "night-shift",
    "Follow the commit's line up to a branch name.",
    reveal=False,
)
```

## Solution

```bash
cd tools
git --no-pager log --oneline --graph --all
```

## Restored

`night-shift`, split off from `main` before the antenna check went in. Pell's work is easy to find when you look at the whole tree.
