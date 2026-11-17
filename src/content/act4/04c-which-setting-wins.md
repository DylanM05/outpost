---
id: which-setting-wins
kind: terminal
title: Which setting wins
system: Archive settings
symbol: controller
scene: repo
repo: ~/tools
skills: git-config
---

## Briefing

Last week a valley technician borrowed the relay terminal to test `~/tools`, and set an email address while they were at it. Your settings say `ranger@kestrel.ridge`, but your latest commit in `~/tools` says `temp@valley.archive`. Ines can't reply to that address. Find out where it's coming from, and stop it.

## Objective

1. Make your commits in `~/tools` use your own email address again, by removing the setting that overrides it. Don't change your global settings.
2. Then commit the staged checklist change, with the message `Add the antenna current check`, so you can see the right address on it.

## Concept

Git reads settings from several files, from the widest to the narrowest:

| Level | File | Applies to |
|---|---|---|
| system | `/etc/gitconfig` | every user on the machine |
| global | `~/.gitconfig` | you, in every repository |
| local | `.git/config` | one repository |

When the same setting is in more than one, the narrowest wins. A repository's own `user.email` beats yours, everywhere inside that repository.

To see where a setting comes from, add `--show-origin`. It prints the file each value came from:

```bash
git config list --show-origin
git config get --show-origin user.email
```

`git log` shows each commit's email next to the author's name, so you can see the result.

## Hints

1. Inside `~/tools`, `git config get --show-origin user.email` shows which file the address comes from.
2. It's the repository's own setting. Remove it with `git config unset --local user.email`.
3. Run `git config get user.email` again, then `git commit -m "Add the antenna current check"`.

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
git config set --local user.email temp@valley.archive
sed -i 's/POWER = 40/POWER = 35/' beacon.py
git add beacon.py
GIT_AUTHOR_DATE="2026-11-16 09:10 +0000" GIT_COMMITTER_DATE="2026-11-16 09:10 +0000" git commit -q -m "Lower the beacon power"
echo '- antenna current' >> checklist.txt
git add checklist.txt
```

## Checks

```python
expect(
    "~/tools uses your email",
    lambda: config("user.email", "~/tools"),
    "ranger@kestrel.ridge",
    "Remove the repository's own user.email, with git config unset --local.",
)
expect(
    "Your global email is unchanged",
    lambda: config("user.email", scope="global"),
    "ranger@kestrel.ridge",
    "Leave ~/.gitconfig as it was, and remove the setting from the repository instead.",
)
expect("You committed the checklist change", lambda: latest("~/tools")["message"], "Add the antenna current check")
expect(
    "The new commit carries your email",
    lambda: git("log -1 --format=%ae", "~/tools"),
    "ranger@kestrel.ridge",
    "Fix the setting first, then commit.",
)
```

## Solution

```bash
cd tools
git config get --show-origin user.email
git config unset --local user.email
git config get user.email
git commit -m "Add the antenna current check"
# Players can read it with git log; -1 shows only the newest commit.
git --no-pager log -1
```

## Restored

The repository's own setting is gone, so yours applies again. The new commit says `ranger@kestrel.ridge`, and Ines can write back.
