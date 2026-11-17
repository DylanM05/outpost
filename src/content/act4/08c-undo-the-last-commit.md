---
id: undo-the-last-commit
kind: terminal
title: Undo the last commit
system: Recovery bench
symbol: instrument
scene: repo
repo: ~/tools
skills: undoing
---

## Briefing

You just committed the uptime report, and it's broken: `status.py` now imports `uptime.py`, but you forgot to stage `uptime.py` itself. Anyone who gets this commit gets a status script that crashes. It's only on the ridge so far, so you can still redo the commit properly.

## Objective

Replace the last commit in `~/tools` with one that has `uptime.py` in it too. In the end there should be one commit, `Add the uptime report`, with both files, on top of `Add the antenna current check`.

## Concept

`git reset --soft` moves the branch you're on back to an earlier commit, and leaves the changes from the commits it undoes staged, ready to commit again:

```bash
git reset --soft HEAD~1
```

`HEAD~1` means one commit before HEAD, the commit before the one you're on. `HEAD~2` is two before, and so on. You can use a hash instead.

After the reset, the commit is undone but nothing is lost: its changes are staged. Add what was missing, and commit again:

```bash
git add uptime.py
git commit -m "Add the uptime report"
```

For exactly this mistake there's a shortcut: stage the missing file and run `git commit --amend`, which replaces the last commit with a new one that includes what's staged now.

Either way, the old commit is replaced, not changed: the new one has a different hash. Only undo commits you haven't shared yet. Once other people have a commit, replacing it means you and they have different histories.

## Hints

1. `git show --stat HEAD` lists the files in the last commit: `uptime.py` isn't one of them.
2. Run `git reset --soft HEAD~1`, then `git status`: the change to `status.py` is staged again.
3. Run `git add uptime.py`, then `git commit -m "Add the uptime report"`.

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
printf 'import time\n\n\ndef report():\n    print(f"up since {time.ctime()}")\n' > uptime.py
printf 'import uptime\n\nuptime.report()\n' >> status.py
git add status.py
commit_as Ranger "2026-11-17 08:10" "Add the uptime report"
```

## Checks

```python
expect(
    "The history ends with one uptime commit",
    lambda: [c["message"] for c in commits("~/tools")][:2],
    ["Add the uptime report", "Add the antenna current check"],
    "Undo the commit with git reset --soft HEAD~1, then commit once.",
)
expect(
    "It comes straight after the antenna check",
    lambda: latest("~/tools")["parents"],
    ["daaf21228a28f6cbbc07df053ff03bda8d0033f5"],
    "Reset only one commit back.",
    reveal=False,
)
check("The commit has uptime.py", lambda: "uptime.py" in tracked("~/tools"), "Stage uptime.py before committing again.")
check("The commit has the status.py change", lambda: "uptime.report()" in (show("~/tools", "HEAD", "status.py") or ""))
expect("Nothing is left uncommitted", lambda: staged("~/tools") + changed("~/tools"), [], "Commit everything the reset put back.")
```

## Solution

```bash
cd tools
git reset --soft HEAD~1
git status
git add uptime.py
git commit -m "Add the uptime report"
python3 status.py
```

## Restored

One commit, both files. The status script works for anyone who gets it, and nobody will ever see the broken version.
