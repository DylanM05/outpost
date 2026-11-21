---
id: add-a-worktree
kind: terminal
title: Check out a second worktree
system: Holding shelf
symbol: equipment
scene: repo
repo: ~/tools
skills: branches
---

## Briefing

Sometimes stashing isn't even ideal — maybe a long check or local server is already running inside `~/tools` on `main`, and you don't want to disturb that directory at all while you patch another branch.

Git lets one repository have **multiple working directories** checked out at the same time, on different branches, sharing the same `.git` history.

## Objective

1. From `~/tools`, attach a linked worktree at `~/tools-hotfix` checked out on the existing `hotfix` branch (`git worktree add ../tools-hotfix hotfix`).
2. Inside `~/tools-hotfix`, change `TIMEOUT=5` to `TIMEOUT=15` in `radio.conf`, stage it, and commit the fix on `hotfix`.
3. Leave `~/tools` untouched on `main` (including your uncommitted note in `notes.txt`).

## Concept

`git worktree` creates a second folder linked to the same repository so two branches can be open side by side:

```bash
git worktree add ../tools-hotfix hotfix
```

- Git checks out `hotfix` into `../tools-hotfix` while `~/tools` stays on `main` with all of its files untouched.
- Commits made in `~/tools-hotfix` immediately appear in `~/tools`'s `git log --all` because both folders share one object database.
- Git refuses to check out the same branch in two worktrees at once, preventing accidental collisions.
- `git worktree list` shows every attached checkout, and `git worktree remove <path>` cleans one up when you're done.

## Hints

1. In `~/tools`, run `git worktree add ../tools-hotfix hotfix`.
2. `cd ~/tools-hotfix`, update `radio.conf` to `TIMEOUT=15`, then `git add radio.conf` and `git commit -m "Raise radio timeout"`.
3. Leave `~/tools` on `main` and keep `~/tools-hotfix` attached so `git worktree list` shows both.

## Setup

```bash
player_git
mkdir tools
cd tools
git init -q
printf 'TIMEOUT=5\n' > radio.conf
git add radio.conf
commit_as "Ines Varga" "2026-11-18 08:00" "Add radio configuration"
git branch hotfix
printf 'do not disturb this checkout\n' > notes.txt
```

## Checks

```python
check(
    "~/tools-hotfix exists as a linked worktree",
    lambda: is_dir("~/tools-hotfix") and "/home/ranger/tools-hotfix" in git("worktree list --porcelain", "~/tools"),
    "Run git worktree add ../tools-hotfix hotfix from ~/tools.",
)
expect("tools-hotfix is on branch hotfix", lambda: branch("~/tools-hotfix"), "hotfix")
expect("tools is still on main", lambda: branch("~/tools"), "main")
expect(
    "hotfix has TIMEOUT=15 committed",
    lambda: show("~/tools", "hotfix", "radio.conf"),
    "TIMEOUT=15\n",
)
expect("tools-hotfix working tree is clean", lambda: status("~/tools-hotfix"), [])
expect("notes.txt in ~/tools was not disturbed", lambda: read("~/tools/notes.txt"), "do not disturb this checkout\n")
```

## Hidden checks

```python
expect("main still has TIMEOUT=5", lambda: show("~/tools", "main", "radio.conf"), "TIMEOUT=5\n")
```

## Solution

```bash
cd tools
git worktree add ../tools-hotfix hotfix
cd ../tools-hotfix
printf 'TIMEOUT=15\n' > radio.conf
git add radio.conf
git commit -m "Raise radio timeout to 15"
```

## Restored

Both branches are open side by side: `hotfix` carries the new timeout while `~/tools` never dropped a single file.
