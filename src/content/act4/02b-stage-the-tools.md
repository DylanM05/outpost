---
id: stage-the-tools
kind: terminal
title: Stage the tools
system: Ridge toolkit
symbol: equipment
scene: repo
repo: ~/tools
skills: commits
---

## Briefing

`~/tools` is a repository, but Git isn't keeping track of anything in it yet. Before you save the first version, choose what goes in. The tools do. `notes-to-self.txt` doesn't: it's the ranger's own scribbles, and the valley doesn't need them.

## Objective

Stage `beacon.py`, `status.py`, and `checklist.txt`, ready for the first commit. Don't stage `notes-to-self.txt`.

## Concept

Saving a version in Git takes two steps. First you **stage** the changes you want to save, then you **commit** them, which saves everything staged as one version.

`git add` stages files:

```bash
git add beacon.py status.py
```

The staged changes wait in the **staging area** (Git also calls it the **index**) until you commit. `git status` lists them under "Changes to be committed", and the files Git still isn't tracking under "Untracked files".

`git add .` stages everything in the folder at once. That's quick, and often what you want, but here it would stage the notes too. If that happens, `git rm --cached notes-to-self.txt` takes them back out of the staging area, and leaves the file where it is. `git status` suggests the same command.

## Hints

1. Run `git status` in `~/tools` to see the untracked files.
2. Give `git add` the names of the three tool files, separated by spaces.
3. Run `git add beacon.py status.py checklist.txt`, then `git status` to check.

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
printf 'ask valley about the spare antenna\nbeacon sounds rough at night??\n' > tools/notes-to-self.txt
git -C tools init -q
```

## Checks

```python
check("No commits yet", lambda: not commits("~/tools"), "Only stage the files this time. Committing comes next.")
expect(
    "The three tools are staged",
    lambda: staged("~/tools"),
    ["beacon.py", "checklist.txt", "status.py"],
    "Run git add with the three file names.",
)
check(
    "notes-to-self.txt isn't staged",
    lambda: "notes-to-self.txt" in untracked("~/tools"),
    "Unstage it with git rm --cached notes-to-self.txt.",
)
```

## Solution

```bash
cd tools
git status
git add beacon.py status.py checklist.txt
git status
```

## Restored

Three files wait in the staging area, and the notes stay out of the archive.
