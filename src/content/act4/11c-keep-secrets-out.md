---
id: keep-secrets-out
kind: terminal
title: Keep secrets out
system: Ignore list
symbol: instrument
scene: repo
repo: ~/tools
skills: commits, undoing
---

## Briefing

Before the archive existed, someone committed the ridge's radio settings to `~/tools`, password file and all. It hasn't been pushed anywhere, but the next push would send the password to the archive. The ridge still needs the file, just not in the repository.

## Objective

In `~/tools`:

1. Stop Git tracking `radio.key`, without deleting it.
2. Ignore it, so it can't be added again by accident.
3. Commit both changes, with the message `Stop tracking the radio key`.

Keep the commit that added it: don't rewrite the history.

## Concept

Some files never belong in a repository:

- **secrets**: passwords, keys, and tokens, often in files like `.env`
- **files made from other files**: `__pycache__`, build output
- **things you can download again**: libraries a project installs
- **files about your machine, not the project**: logs, editor settings, `.DS_Store`

Ignoring a file only stops Git starting to track it. `radio.key` was committed, so Git keeps tracking it whatever `.gitignore` says. `git rm --cached` stops tracking a file: it stages its removal from the repository, and leaves your copy alone:

```bash
git rm --cached radio.key
```

Plain `git rm` would delete your copy as well.

The next commit won't have the file, but every earlier commit still does, and anyone with a copy of the repository can read it with `git show`. Once a secret has been committed and shared, treat it as public, and change it. Here it hasn't left the ridge, so stopping now is enough.

## Hints

1. `git rm --cached radio.key` stages the removal, and `git status` shows it as deleted, while `ls` still shows the file.
2. `echo 'radio.key' >> .gitignore`, then stage `.gitignore`.
3. Commit with `git commit -m "Stop tracking the radio key"`.

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
printf 'channel=3\nsquelch=2\n' > radio.conf
printf 'KR-RIDGE radio password: amber-falcon-73\n' > radio.key
git add radio.conf radio.key
commit_as Ranger "2026-11-17 08:30" "Add the radio settings"
```

## Checks

```python
check("radio.key isn't in the latest commit", lambda: "radio.key" not in tracked("~/tools"), "Run git rm --cached radio.key, then commit.")
check("radio.conf still is", lambda: "radio.conf" in tracked("~/tools"), "Only stop tracking radio.key.")
check(
    "Your copy of radio.key is still there",
    lambda: "amber-falcon-73" in (read("~/tools/radio.key") or ""),
    "Use --cached, which keeps your copy. Start over to get the file back.",
)
check(
    "Git ignores radio.key",
    lambda: run("git check-ignore -q radio.key", "~/tools").code == 0 and ".gitignore" in tracked("~/tools"),
    "Add radio.key to .gitignore, and commit the .gitignore too.",
)
expect(
    "The history is kept",
    lambda: [c["message"] for c in commits("~/tools")][:2],
    ["Stop tracking the radio key", "Add the radio settings"],
    "Make one new commit on top of Add the radio settings.",
)
expect("Nothing is left to commit", lambda: staged("~/tools") + changed("~/tools"), [])
```

## Solution

```bash
cd tools
git rm --cached radio.key
echo 'radio.key' >> .gitignore
git add .gitignore
git status
git commit -m "Stop tracking the radio key"
```

## Restored

The radio password stays on the ridge, and `.gitignore` keeps it there. When the ridge's tools go to the archive, the key won't go with them.
