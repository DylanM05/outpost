---
id: rename-the-branch
kind: terminal
title: Rename the branch
system: Branch lines
symbol: instrument
scene: repo
repo: ~/antenna
skills: branches
---

## Briefing

The valley has sent the ridge its antenna repository, `~/antenna`, from before it started naming every first branch `main`. Its only branch is still called `master`, and the archive's tools all expect `main`.

## Objective

Rename the `master` branch in `~/antenna` to `main`, keeping its commits.

## Concept

Every repository's history starts on a **default branch**. Git's own name for it is `master`, and many older repositories still use that. Most projects and code hosting sites now use `main`, and the `init.defaultBranch` setting you made in Sign your work means your new repositories start on `main` too.

`git branch -m` renames a branch:

```bash
git branch -m master main
```

The commits don't change at all: renaming only changes the name that points to them. Leave out the first name, `git branch -m main`, and it renames the branch you're on.

## Hints

1. Run it inside `~/antenna`. `git branch` shows the current name first.
2. `-m` takes the old name, then the new one.
3. Run `git branch -m master main`, then `git branch` to check.

## Setup

```bash
player_git
mkdir antenna
cd antenna
git init -q -b master
printf 'mast=north ridge\nheight=12m\n' > antenna.conf
git add antenna.conf
commit_as "Tomas Reid" "2026-08-30 15:00" "Add the antenna settings"
printf 'guy wires=4\n' >> antenna.conf
git add antenna.conf
commit_as "Tomas Reid" "2026-09-02 11:20" "Record the guy wires"
```

## Checks

```python
expect("~/antenna has one branch, main", lambda: branches("~/antenna"), ["main"], "Rename master to main with git branch -m.")
expect("The repository is on main", lambda: branch("~/antenna"), "main")
expect(
    "Its commits are unchanged",
    lambda: [c["message"] for c in commits("~/antenna")],
    ["Record the guy wires", "Add the antenna settings"],
    "Rename the branch rather than starting a new one. Start over to get the commits back.",
)
```

## Solution

```bash
cd antenna
git branch
git branch -m master main
git branch
```

## Restored

`~/antenna` is on `main`, like every other repository in the archive. Its history didn't notice.
