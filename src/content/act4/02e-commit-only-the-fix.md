---
id: commit-only-the-fix
kind: terminal
title: Commit only the fix
system: Ridge toolkit
symbol: equipment
scene: repo
repo: ~/tools
skills: commits
---

## Briefing

You've changed two files in `~/tools`. In `beacon.py`, the frequency is finally the line's `147.330`, and that fix is finished. In `checklist.txt`, you've started adding a new check, but you haven't found out yet whether it's right. The fix should go to the archive now. The checklist shouldn't, not yet.

## Objective

Commit only the change to `beacon.py`, with the message `Fix the beacon frequency`. Leave the change to `checklist.txt` uncommitted, but don't lose it.

## Concept

Because committing takes two steps, you choose what goes in each commit. Stage just the changes that belong together, and commit those. Anything you haven't staged stays as it is in your files, ready for a later commit:

```bash
git add beacon.py
git commit -m "Fix the beacon frequency"
```

This is why Git has a staging area at all: one commit should do one thing. A history where each commit is one complete change is easy to read, and easy to undo a piece at a time.

To check what you're about to commit, `git diff --staged` shows the staged changes, the way `git diff` shows the unstaged ones.

## Hints

1. Stage only `beacon.py`, then check with `git status`: the checklist should still be under "Changes not staged for commit".
2. `git diff --staged` shows exactly what the commit will contain.
3. Run `git add beacon.py`, then `git commit -m "Fix the beacon frequency"`.

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
sed -i 's/147.360/147.330/' beacon.py
echo '- antenna current (ask the valley what is normal?)' >> checklist.txt
```

## Checks

```python
expect("~/tools has a second commit", lambda: len(commits("~/tools")), 2, "Commit once more, after staging only beacon.py.")
expect("Its message", lambda: latest("~/tools")["message"], "Fix the beacon frequency")
expect(
    "It changes beacon.py, and nothing else",
    lambda: git("diff-tree --no-commit-id --name-only -r HEAD", "~/tools").split(),
    ["beacon.py"],
    "Stage only beacon.py before committing. Start over to try again.",
)
check("It sets the frequency to 147.330", lambda: 'FREQUENCY = "147.330"' in (show("~/tools", "HEAD", "beacon.py") or ""))
check(
    "The checklist change is still in your files, uncommitted",
    lambda: "checklist.txt" in changed("~/tools") and "antenna current" in (read("~/tools/checklist.txt") or ""),
    "Leave checklist.txt as it is: don't stage it, and don't undo it.",
)
```

## Solution

```bash
cd tools
git status
git add beacon.py
git diff --staged
git commit -m "Fix the beacon frequency"
```

## Restored

The fix is in the history on its own, with a message that says what it does. The checklist idea waits until you know it's right.
