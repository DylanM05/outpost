---
id: squash-a-branch
kind: terminal
title: Squash a noisy branch
system: Safe undos
symbol: controller
scene: repo
repo: ~/tools
skills: branches, commits
---

## Briefing

Your feature branch `sensor-filter` works well, but its history is full of noisy work-in-progress commits (`"wip"`, `"fix typo"`, `"actually filter negatives"`, `"cleanup"`). Before landing it on `main`, you want all of its changes folded into **one clean commit** on `main`.

## Objective

In `~/tools`:

1. Stay on `main` and bring in all changes from `sensor-filter` without its messy commit history using `git merge --squash sensor-filter`.
2. Commit the staged result on `main` with a clear message (for example, `"Add sensor reading filter"`).

## Concept

When a branch has a trail of tiny "wip" and "oops" commits that add noise to `main`, you can **squash** them into a single clean commit:

```bash
git switch main
git merge --squash sensor-filter
git commit -m "Add sensor reading filter"
```

Unlike a normal `git merge`:
- `--squash` combines every change from `sensor-filter` and stages it in your index, **without** creating a merge commit or recording `sensor-filter` as a second parent.
- You then run `git commit -m "..."` once to record a single, clean, single-parent commit on `main`.

(You can also squash commits inside a branch before merging with interactive rebase, `git rebase -i`, marking follow-up commits as `squash` or `fixup`.)

## Hints

1. Check `git log --oneline sensor-filter` to see the 4 noisy commits.
2. On `main`, run `git merge --squash sensor-filter`.
3. Run `git commit -m "Add sensor reading filter"` to finish with one clean commit on `main`.

## Setup

```bash
player_git
mkdir tools
cd tools
git init -q
printf '# ridge tools\n' > README.md
git add README.md
commit_as "Ines Varga" "2026-11-18 08:00" "Initial tools repo"
git switch -q -c sensor-filter
printf 'def clean(xs):\n    return xs\n' > filter.py
git add filter.py
commit_as Ranger "2026-11-18 09:00" "wip"
printf 'def clean(xs):\n    return [x for x in xs if x is not None]\n' > filter.py
git add filter.py
commit_as Ranger "2026-11-18 09:05" "fix typo"
printf 'def clean(xs):\n    return [x for x in xs if x is not None and x >= 0]\n' > filter.py
git add filter.py
commit_as Ranger "2026-11-18 09:12" "actually filter negatives"
printf '# Filters invalid sensor readings.\ndef clean(xs):\n    return [x for x in xs if x is not None and x >= 0]\n' > filter.py
git add filter.py
commit_as Ranger "2026-11-18 09:20" "cleanup"
git switch -q main
```

## Checks

```python
expect("The repository is on main", lambda: branch("~/tools"), "main")
expect(
    "main has exactly 2 commits total (initial + one squashed commit)",
    lambda: len(commits("~/tools", "main")),
    2,
    "Use git merge --squash sensor-filter on main, then git commit -m '...'.",
)
check(
    "The new commit on main is a single-parent commit (not a merge commit)",
    lambda: len(latest("~/tools", "main")["parents"]) == 1,
)
expect("Working tree is clean", lambda: status("~/tools"), [])
check(
    "filter.py on main has the complete final filter implementation",
    lambda: run("python3 -B -c 'import filter; assert filter.clean([None, -2, 0, 5]) == [0, 5]'", "~/tools").code == 0,
)
```

## Hidden checks

```python
check(
    "No noisy 'wip' commit appears in main's history",
    lambda: all(c["message"] not in ("wip", "fix typo", "cleanup") for c in commits("~/tools", "main")),
)
```

## Solution

```bash
cd tools
git merge --squash sensor-filter
git commit -m "Add sensor reading filter"
```

## Restored

Four messy drafts became one clear commit on `main`, and the filter passes on the first run.
