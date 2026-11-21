---
id: resolve-a-merge-conflict
kind: terminal
title: Resolve a merge conflict
system: Conflict desk
symbol: controller
scene: repo
repo: ~/tools
skills: branches
---

## Briefing

Earlier in the archive, `git merge` combined two branches automatically because they edited different files. Now both `main` and `winter-power` have edited the **same lines** of `beacon.conf`:

- On `main`, Mara raised `POWER=100` for the ridge storm.
- On `winter-power`, Tomas added `HEATER=on` and set `POWER=55`.

We want **both** Mara's `POWER=100` and Tomas's `HEATER=on`. Git can't guess which power level you want, so it will pause and ask you to decide.

## Objective

In `~/tools`:

1. Start merging `winter-power` into `main` (`git merge winter-power`).
2. Edit `beacon.conf` to remove all conflict markers and keep `CALLSIGN=KR-RIDGE`, `FREQUENCY=147.330`, `POWER=100`, and `HEATER=on` (one per line, in that order).
3. Stage `beacon.conf` and finish the merge commit on `main`.

## Concept

When two branches change the same lines differently, `git merge` stops halfway and marks the file with **conflict markers**:

```text
<<<<<<< HEAD
POWER=100
=======
POWER=55
HEATER=on
>>>>>>> winter-power
```

- Everything between `<<<<<<< HEAD` and `=======` is your current branch (`main`).
- Everything between `=======` and `>>>>>>> winter-power` is the incoming branch.

Resolving a conflict always takes the same three steps:

1. Open the conflicted file (`nano beacon.conf`), choose or combine the lines you want, and **delete all three marker lines** (`<<<<<<<`, `=======`, `>>>>>>>`).
2. Tell Git the file is resolved by staging it: `git add beacon.conf`.
3. Finish the merge commit: `git commit` (save and exit `nano`, or run `git commit --no-edit`).

`git status` always shows which files are still `both modified` and reminds you of the next command.

## Hints

1. Run `git merge winter-power` while on `main`. It will print `CONFLICT (content): Merge conflict in beacon.conf`.
2. Open `beacon.conf` (or overwrite it cleanly) so it has these exact four lines and no `<<<<<<<` / `=======` / `>>>>>>>` markers:
   ```text
   CALLSIGN=KR-RIDGE
   FREQUENCY=147.330
   POWER=100
   HEATER=on
   ```
3. Run `git add beacon.conf`, then `git commit --no-edit`.

## Setup

```bash
player_git
mkdir tools
cd tools
git init -q
cat > beacon.conf <<'EOF'
CALLSIGN=KR-RIDGE
FREQUENCY=147.330
POWER=40
EOF
git add beacon.conf
commit_as "Ines Varga" "2026-11-18 08:00" "Add beacon configuration"
git switch -q -c winter-power
cat > beacon.conf <<'EOF'
CALLSIGN=KR-RIDGE
FREQUENCY=147.330
POWER=55
HEATER=on
EOF
git add beacon.conf
commit_as "Tomas Reid" "2026-11-18 09:15" "Enable winter heater and bump power"
git switch -q main
cat > beacon.conf <<'EOF'
CALLSIGN=KR-RIDGE
FREQUENCY=147.330
POWER=100
EOF
git add beacon.conf
commit_as "Mara Okafor" "2026-11-18 10:00" "Raise ridge storm power to 100"
```

## Checks

```python
EXPECTED = "CALLSIGN=KR-RIDGE\nFREQUENCY=147.330\nPOWER=100\nHEATER=on\n"

expect("The repository is on main", lambda: branch("~/tools"), "main", "Stay on main and merge winter-power into it.")
check(
    "main has a merge commit joining winter-power",
    lambda: len(latest("~/tools", "main")["parents"]) == 2 and rev("~/tools", "winter-power") in latest("~/tools", "main")["parents"],
    "Run git merge winter-power on main, resolve beacon.conf, git add it, and commit.",
)
expect(
    "beacon.conf has both POWER=100 and HEATER=on with no conflict markers",
    lambda: show("~/tools", "main", "beacon.conf"),
    EXPECTED,
)
expect("Working tree is clean and merge is complete", lambda: status("~/tools"), [], "Stage beacon.conf and finish the commit.")
```

## Hidden checks

```python
check(
    "No conflict markers remain in beacon.conf",
    lambda: all(m not in (read("~/tools/beacon.conf") or "") for m in ("<<<<<<<", "=======", ">>>>>>>")),
)
```

## Solution

```bash
cd tools
git merge winter-power
cat > beacon.conf <<'EOF'
CALLSIGN=KR-RIDGE
FREQUENCY=147.330
POWER=100
HEATER=on
EOF
git add beacon.conf
git commit --no-edit
```

## Restored

The conflict is resolved without losing Mara's storm power or Tomas's heater, and the merge commit records both parents cleanly.
