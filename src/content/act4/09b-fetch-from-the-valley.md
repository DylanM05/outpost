---
id: fetch-from-the-valley
kind: terminal
title: Fetch from the valley
system: Valley link
symbol: equipment
scene: repo
repo: ~/tools
skills: remotes
---

## Briefing

The valley says it added something useful to the archive's copy of the ridge's tools. Your repository knows where the archive is now, but not what's in it. Find out what the valley added, without changing your own work yet.

## Objective

Fetch from `origin` in `~/tools`, then report the message of the newest commit on the archive's `main`.

## Concept

`git fetch` downloads the commits a remote has that you don't:

```bash
git fetch
```

Fetching doesn't change your branches or your files. Instead, Git records where each of the remote's branches is with a **remote-tracking branch**, named after the remote: `origin/main` is where `origin`'s `main` was when you last fetched. The panel shows them with dashed labels.

You can look at a remote-tracking branch like any other:

```bash
git log origin/main
```

Until you fetch, your repository has no idea what's changed on the remote. Fetching is always safe, so do it whenever you want to know.

## Hints

1. Run `git fetch` inside `~/tools`.
2. Then `git log origin/main`, or `git log --oneline --all`.
3. The newest commit on `origin/main` is at the top. Report its message.

## Root setup

```bash
mkdir -p /srv/archive
chown ranger:ranger /srv/archive
```

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
git clone -q --bare . /srv/archive/tools.git
git clone -q /srv/archive/tools.git /tmp/valley-tools
cd /tmp/valley-tools
printf 'Valley archive: Ines Varga, channel 3\nValley relay: Tomas Reid, channel 5\n' > contacts.txt
git add contacts.txt
commit_as "Ines Varga" "2026-11-17 12:00" "Add the valley contact list"
git push -q
cd
rm -rf /tmp/valley-tools
cd tools
git remote add origin /srv/archive/tools.git
```

## Report

What's the message of the newest commit on the archive's `main`?

```text
Add the valley contact list
```

## Checks

```python
check(
    "You fetched from origin",
    lambda: rev("~/tools", "origin/main") == rev("/srv/archive/tools.git", "main") != None,
    "Run git fetch inside ~/tools.",
)
expect(
    "Your main hasn't changed",
    lambda: rev("~/tools", "main"),
    "daaf21228a28f6cbbc07df053ff03bda8d0033f5",
    "Only fetch this time. Bringing the commit into main comes next. Start over to try again.",
    reveal=False,
)
expect(
    "You reported the valley's commit",
    answer().lower(),
    "add the valley contact list",
    "Run git log origin/main, and read the top commit's message.",
    reveal=False,
)
```

## Solution

```bash
cd tools
git fetch
git --no-pager log --oneline origin/main
```

## Restored

The valley added a contact list for the archive and the relay. It's in your repository now, on `origin/main`, waiting for you to decide what to do with it.
