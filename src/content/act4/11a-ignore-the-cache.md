---
id: ignore-the-cache
kind: terminal
title: Ignore the cache
system: Ignore list
symbol: instrument
scene: repo
repo: ~/tools
skills: commits
---

## Briefing

Running the ridge's tools leaves a `__pycache__` folder in `~/tools`, and `git status` lists what's in it as untracked every time. Nobody wants those files in the archive, and everyone's tired of seeing them.

## Objective

In `~/tools`, make Git ignore the `__pycache__` folder with a `.gitignore` file, and commit the `.gitignore` with the message `Ignore Python's cache`.

## Concept

When Python runs a program that imports modules, it saves compiled copies of them in a `__pycache__` folder, so they load faster next time. Python rebuilds them whenever it needs to, and they're different on every machine. Files that are made from other files like this don't belong in a repository.

A file named `.gitignore`, at the top of the repository, lists what Git should ignore, one pattern per line:

```text
__pycache__/
```

A name ending in `/` matches folders with that name, anywhere in the repository. Once a file is ignored, `git status` stops listing it, and `git add .` skips it.

Commit the `.gitignore` itself, so everyone who works on the repository ignores the same files.

`.gitignore` only affects files Git isn't tracking yet. A file that's already been committed stays tracked, whatever the `.gitignore` says.

## Hints

1. `echo '__pycache__/' > .gitignore` makes the file, or write it with `nano`.
2. `git status` should now list only `.gitignore` as untracked.
3. Stage `.gitignore`, then `git commit -m "Ignore Python's cache"`.

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
python3 -m py_compile beacon.py status.py
```

## Checks

```python
check(
    "Git ignores __pycache__",
    lambda: run("git check-ignore -q __pycache__/" + (listing("~/tools/__pycache__") or ["beacon.pyc"])[0], "~/tools").code == 0,
    "Put __pycache__/ in a file named .gitignore at the top of ~/tools.",
)
check("git status doesn't list the cache", lambda: not [f for f in untracked("~/tools") if "__pycache__" in f])
check(".gitignore is committed", lambda: ".gitignore" in tracked("~/tools"), "Stage .gitignore and commit it.")
expect("The commit's message", lambda: latest("~/tools")["message"], "Ignore Python's cache")
check("No cache files were committed", lambda: not [f for f in tracked("~/tools") if "__pycache__" in f])
```

## Solution

```bash
cd tools
git status
echo '__pycache__/' > .gitignore
git status
git add .gitignore
git commit -m "Ignore Python's cache"
```

## Restored

`git status` is quiet again. The cache comes and goes as Python likes, and Git doesn't look at it.
