---
id: rebase-a-branch
kind: terminal
title: Rebase a branch
system: Straight lines
symbol: controller
scene: repo
repo: ~/tools
skills: branches
---

## Briefing

You started `add-uptime`, a little script that reports how long the relay has been up, from an older `main`. Since then, `main` has moved on twice. Before anyone reviews your branch, you'd like it to start from `main` as it is today, as if you'd only just begun.

## Objective

Rebase `add-uptime` in `~/tools` onto `main`, so its commit comes after `main`'s latest one.

## Concept

**Rebasing** moves a branch so it starts from a different commit. Git takes the commits on your branch that aren't on the other one, and replays them, one at a time, on top of it:

```text
before:   A - B - C - D        main
               \
                U              add-uptime

after:    A - B - C - D        main
                       \
                        U'     add-uptime
```

On your branch, give it the branch to start from:

```bash
git switch add-uptime
git rebase main
```

The result looks as if you'd made the branch from today's `main`. `U'` has the same changes and message as `U`, but it's a new commit with a new hash, because its parent is different, and the parent is part of what the hash is made from. Your files now include everything new on `main`, as well as your own work.

## Hints

1. Rebase from the branch you want to move, so stay on `add-uptime`.
2. Run `git rebase main` inside `~/tools`.
3. `git log --oneline --graph --all` shows the branch now coming straight off `main`.

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
git switch -q -c add-uptime HEAD~1
printf 'import time\n\nprint(f"up since {time.ctime()}")\n' > uptime.py
git add uptime.py
commit_as Ranger "2026-11-17 08:10" "Add the uptime report"
git switch -q main
sed -i 's/POWER = 40/POWER = 55/' beacon.py
git add beacon.py
commit_as Ranger "2026-11-17 09:00" "Raise the beacon power"
git switch -q add-uptime
```

## Checks

```python
expect("main hasn't changed", lambda: [c["message"] for c in commits("~/tools", "main")][:2], ["Raise the beacon power", "Add the antenna current check"], "Rebase add-uptime, not main.")
check(
    "add-uptime starts from main's latest commit",
    lambda: git("merge-base main add-uptime", "~/tools") == rev("~/tools", "main"),
    "Run git rebase main while on add-uptime.",
)
expect(
    "add-uptime has its one commit on top",
    lambda: [c["message"] for c in commits("~/tools", "add-uptime")][:2],
    ["Add the uptime report", "Raise the beacon power"],
)
check("There's no merge commit", lambda: all(len(c["parents"]) <= 1 for c in commits("~/tools", "add-uptime")), "Rebase rather than merging main in.")
```

## Solution

```bash
cd tools
git rebase main
git --no-pager log --oneline --graph --all
```

## Restored

`add-uptime` comes straight off today's `main`, as if you'd started it this morning. Reviewing it means looking at one commit, against the latest of everything else.
