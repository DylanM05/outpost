---
id: stash-unfinished-work
kind: terminal
title: Stash unfinished work
system: Holding shelf
symbol: equipment
scene: repo
repo: ~/tools
skills: branches, undoing
---

## Briefing

You are halfway through rewriting `diag.py` on `main` — it's not ready to commit yet. Just now, the valley radioed an urgent one-line fix needed on the `hotfix` branch: `status.py` still prints `"STANDBY"` instead of `"ONLINE"`.

You need to shelve your unfinished work on `diag.py`, switch to `hotfix`, commit the fix there, switch back to `main`, and pull your unfinished `diag.py` changes right back out.

## Objective

In `~/tools`:

1. Save your uncommitted changes to `diag.py` on the stash (`git stash`).
2. Switch to `hotfix`, change `"STANDBY"` to `"ONLINE"` in `status.py`, and commit that change on `hotfix`.
3. Switch back to `main` and restore your stashed `diag.py` edits (`git stash pop`). Leave `diag.py` uncommitted on `main` so you can keep working on it, and leave the stash empty.

## Concept

When an interruption hits mid-task, `git stash` tucks your tracked uncommitted edits onto a stack and resets your working tree to a clean `HEAD`:

```bash
git stash
git switch hotfix
# make the fix and commit it...
git switch main
git stash pop
```

- `git stash` (short for `git stash push`) saves tracked modifications and cleans the working tree. (Pass `-u` if you also want to stash untracked files.)
- `git stash list` shows what's sitting on the shelf (`stash@{0}`, `stash@{1}`, ...).
- `git stash pop` reapplies the top entry and removes it from the stash list. (`git stash apply` reapplies it while keeping a copy on the shelf.)

## Hints

1. Inside `~/tools`, run `git stash` to shelve `diag.py`.
2. Run `git switch hotfix`, update `status.py` so it prints `"ONLINE"`, then `git add status.py` and `git commit -m "Switch status to ONLINE"`.
3. Run `git switch main`, then `git stash pop`. Verify `git diff diag.py` shows your draft again and `git stash list` is empty.

## Setup

```bash
player_git
mkdir tools
cd tools
git init -q
cat > status.py <<'EOF'
print("STANDBY")
EOF
cat > diag.py <<'EOF'
def battery_ok(volts):
    return volts >= 11.5
EOF
git add .
commit_as "Ines Varga" "2026-11-18 08:00" "Add status and diagnostics scripts"
git branch hotfix
cat > diag.py <<'EOF'
def battery_ok(volts):
    # WIP: adding low-temp compensation
    return volts >= 11.8
EOF
```

## Checks

```python
expect("The repository is back on main", lambda: branch("~/tools"), "main")
check(
    "hotfix has the ONLINE status committed",
    lambda: 'print("ONLINE")' in (show("~/tools", "hotfix", "status.py") or ""),
    "Switch to hotfix, change STANDBY to ONLINE in status.py, and commit it.",
)
check(
    "main did not accidentally get the hotfix commit",
    lambda: 'print("STANDBY")' in (show("~/tools", "main", "status.py") or ""),
    "Commit the status fix on hotfix, not on main.",
)
check(
    "Your WIP edits to diag.py are back in the working tree",
    lambda: "low-temp compensation" in (read("~/tools/diag.py") or "") and "11.8" in (read("~/tools/diag.py") or ""),
    "Run git stash pop after switching back to main.",
)
check(
    "diag.py is still uncommitted work on main",
    lambda: "diag.py" in changed("~/tools") and "low-temp compensation" not in (show("~/tools", "main", "diag.py") or ""),
)
expect("The stash stack is empty", lambda: git("stash list", "~/tools"), "", "Use git stash pop (not apply) so the entry is cleared.")
```

## Hidden checks

```python
check(
    "hotfix moved ahead of main by at least one commit",
    lambda: rev("~/tools", "hotfix") != rev("~/tools", "main"),
)
```

## Solution

```bash
cd tools
git stash
git switch hotfix
sed -i 's/STANDBY/ONLINE/' status.py
git add status.py
git commit -m "Report ONLINE in status.py"
git switch main
git stash pop
```

## Restored

The urgent hotfix shipped on its own branch, and your half-finished diagnostics rewrite is right back where you left it.
