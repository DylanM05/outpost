---
id: whose-logbook
kind: terminal
title: Whose logbook is it?
system: Relay security
symbol: controller
scene: console
skills: permissions
---

## Briefing

The relay is shared. The valley crew logs in to it too, under their own name, and some files are theirs, some are yours, and some belong to the machine itself. Before you change anything in the shared folder, find out who you are on this machine, and whose files you're looking at.

## Objective

Find out which user you are, then use `ls -l` on `/srv/relay/shared` to see who owns each file. Report the owner of `logbook.txt`.

## Concept

Linux has **users**, and every file belongs to one of them. Every user also belongs to one or more **groups**, and every file belongs to a group too.

- `whoami` prints your user name.
- `id` prints your user and every group you're in.

`ls -l` prints a long listing, one file per line:

```text
-rw-r--r-- 1 ranger ranger 412 Nov 15 06:00 notes.txt
```

Left to right, that's the file's type and **permissions**, its number of links, its **owner**, its **group**, its size in bytes, when it last changed, and its name. The first character is `-` for a file, `d` for a folder, and `l` for a link.

One user is special: **root**, the administrator, who may do anything to any file. Files that belong to the machine itself are usually owned by root.

## Hints

1. Run `whoami`, then `id`.
2. Run `ls -l /srv/relay/shared`.
3. The owner is the third column, just after the number of links. Report it for `logbook.txt`.

## Root setup

```bash
adduser -D -H -g "Valley crew" valley
mkdir -p /srv/relay/shared
echo "2026-11-14 valley crew: KR-RELAY-4 antenna mount checked" > /srv/relay/shared/logbook.txt
chown valley:valley /srv/relay/shared/logbook.txt
echo "radio keys, do not share" > /srv/relay/shared/keys.txt
chmod 600 /srv/relay/shared/keys.txt
echo "schedule: supply run every Thursday" > /srv/relay/shared/schedule.txt
chown ranger:ranger /srv/relay/shared/schedule.txt
```

## Report

Which user owns logbook.txt?

```text
valley
```

## Checks

```python
check("You checked who you are", lambda: ran("whoami") or ran("id"), "Run whoami.")
check(
    "You looked at the long listing",
    lambda: any(re.search(r"(^|\s)-[a-zA-Z]*l", arguments) for arguments in calls("ls")) or "ll" in commands(),
    "ls -l shows each file's owner.",
)
expect("You reported the logbook's owner", answer().lower(), "valley", "It's the third column of the logbook's line.", reveal=False)
```

## Solution

```bash
whoami
id
ls -l /srv/relay/shared
```

## Restored

The logbook is the valley crew's, the schedule is yours, and the radio keys belong to root. Now you know whose files you'd be touching.
