---
id: cherry-pick-a-fix
kind: terminal
title: Cherry-pick one fix
system: Safe undos
symbol: controller
scene: repo
repo: ~/tools
skills: branches
---

## Briefing

Tomas has three commits on the `experiments` branch: two unfinished prototype scripts (`proto_a.py` and `proto_b.py`) and one urgent bug fix in the middle (`"Fix zero-division in battery check"`, touching `battery.py`).

We need that bug fix on `main` right now, **without** merging the unfinished experiments along with it.

## Objective

In `~/tools`:

1. Inspect `experiments` with `git log --oneline experiments`.
2. Staying on `main`, copy **only** the `"Fix zero-division in battery check"` commit onto `main` using `git cherry-pick <hash>`.

## Concept

`git cherry-pick <commit>` takes the diff of a single commit from anywhere in the repository and applies it as a **new commit** on your current branch:

```bash
git log --oneline experiments
git switch main
git cherry-pick <hash>
```

Because the copied commit has a new parent (`main`), it gets a new commit hash — but its diff, author, and commit message are preserved, and the other commits on `experiments` stay strictly off `main`.

## Hints

1. Run `git log --oneline experiments` to spot the commit hash for `"Fix zero-division in battery check"`.
2. Make sure you're on `main` (`git branch`), then run `git cherry-pick <hash>`.
3. Verify `proto_a.py` and `proto_b.py` are not on `main`, while `battery.py` has the guard against `capacity == 0`.

## Setup

```bash
player_git
mkdir tools
cd tools
git init -q
cat > battery.py <<'EOF'
def pct(charge, capacity):
    return round(charge / capacity * 100)
EOF
git add battery.py
commit_as "Ines Varga" "2026-11-18 08:00" "Add battery percentage helper"
git switch -q -c experiments
printf 'print("unfinished prototype A")\n' > proto_a.py
git add proto_a.py
commit_as "Tomas Reid" "2026-11-18 09:00" "WIP: prototype A"
cat > battery.py <<'EOF'
def pct(charge, capacity):
    if capacity <= 0:
        return 0
    return round(charge / capacity * 100)
EOF
git add battery.py
commit_as "Tomas Reid" "2026-11-18 09:30" "Fix zero-division in battery check"
printf 'print("unfinished prototype B")\n' > proto_b.py
git add proto_b.py
commit_as "Tomas Reid" "2026-11-18 10:00" "WIP: prototype B"
git switch -q main
```

## Checks

```python
expect("The repository is on main", lambda: branch("~/tools"), "main")
expect(
    "main has the zero-division fix commit on top",
    lambda: latest("~/tools", "main")["message"],
    "Fix zero-division in battery check",
    "Use git cherry-pick <hash> while on main.",
)
check(
    "battery.py guards against zero capacity on main",
    lambda: run("python3 -B -c 'import battery; assert battery.pct(10, 0) == 0 and battery.pct(5, 10) == 50'", "~/tools").code == 0,
)
expect(
    "Only battery.py is tracked on main (no prototypes leaked)",
    lambda: tracked("~/tools", "main"),
    ["battery.py"],
    "Do not merge the whole experiments branch; cherry-pick only the fix commit.",
)
```

## Hidden checks

```python
check("No merge commits on main", lambda: all(len(c["parents"]) <= 1 for c in commits("~/tools", "main")))
check("git cherry-pick was used", lambda: len(git_calls("cherry-pick")) >= 1)
```

## Solution

```bash
cd tools
git --no-pager log --oneline experiments
git cherry-pick $(git log experiments --grep="Fix zero-division" --format=%H -1)
```

## Restored

Only the zero-division fix landed on `main`, while Tomas's two prototypes stay safely tucked away on `experiments`.
