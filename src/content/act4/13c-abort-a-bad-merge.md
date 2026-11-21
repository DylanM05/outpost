---
id: abort-a-bad-merge
kind: terminal
title: Abort a messy merge
system: Conflict desk
symbol: controller
scene: repo
repo: ~/tools
skills: branches, undoing
---

## Briefing

Someone started merging an experimental branch (`overclock-test`) into `main` in `~/tools` and ran straight into conflicts across multiple config files. The experiment isn't ready for production yet — we shouldn't resolve this merge at all.

## Objective

In `~/tools`:

1. Inspect the state with `git status`.
2. Abort the in-progress merge so `main` returns cleanly to its pre-merge state, with no conflict markers left behind.

## Concept

Whenever a merge (or rebase) goes sideways and you realize you started from the wrong branch or aren't ready to resolve it, you never have to untangle conflict markers by hand:

```bash
git merge --abort
```

That single command restores both the index and your working files to exactly how `HEAD` looked before `git merge` ran, and clears the in-progress merge state (`.git/MERGE_HEAD`).

The equivalent for a paused rebase is `git rebase --abort`.

## Hints

1. Run `git status` inside `~/tools` to see the active merge conflict.
2. Run `git merge --abort`.
3. Run `git status` again — it should report a clean working tree on `main`.

## Setup

```bash
player_git
mkdir tools
cd tools
git init -q
printf 'VOLTAGE=12\nLIMIT=50\n' > power.conf
printf 'INTERVAL=60\n' > beacon.conf
git add .
commit_as "Ines Varga" "2026-11-18 08:00" "Add baseline station configs"
git switch -q -c overclock-test
printf 'VOLTAGE=24\nLIMIT=120\n' > power.conf
printf 'INTERVAL=5\n' > beacon.conf
git add .
commit_as "Pell Hansen" "2026-11-18 09:00" "Overclock power and beacon"
git switch -q main
printf 'VOLTAGE=14\nLIMIT=60\n' > power.conf
printf 'INTERVAL=30\n' > beacon.conf
git add .
commit_as "Mara Okafor" "2026-11-18 10:00" "Tune safe winter power limits"
git merge overclock-test >/dev/null 2>&1 || true
```

## Checks

```python
expect("The repository is on main", lambda: branch("~/tools"), "main")
check("No merge is in progress", lambda: not exists("~/tools/.git/MERGE_HEAD"), "Run git merge --abort inside ~/tools.")
expect("Working tree is clean", lambda: status("~/tools"), [])
expect(
    "main stayed at Mara's safe commit (no merge commit made)",
    lambda: latest("~/tools", "main")["message"],
    "Tune safe winter power limits",
)
expect("power.conf is back to safe limits", lambda: read("~/tools/power.conf"), "VOLTAGE=14\nLIMIT=60\n")
```

## Hidden checks

```python
expect("beacon.conf is back to safe limits", lambda: read("~/tools/beacon.conf"), "INTERVAL=30\n")
check("overclock-test branch is still intact", lambda: "overclock-test" in branches("~/tools"))
```

## Solution

```bash
cd tools
git status
git merge --abort
git status
```

## Restored

The half-finished merge is cleared out in one command, leaving `main` safe and `overclock-test` untouched for another day.
