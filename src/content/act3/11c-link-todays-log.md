---
id: link-todays-log
kind: terminal
title: Link today's log
system: Operator's bunk
symbol: instrument
scene: files
skills: filesystem
---

## Briefing

The daily logs pile up in `~/logs/daily`, one file per date, and every operator wants the same one: today's. Typing the date each time is a nuisance. A link can stand in for the file, under a name that never changes.

## Objective

Make a symbolic link, `~/logs/today.log`, that points to `~/logs/daily/2026-11-15.log`. Then read today's log through the link.

## Concept

A **symbolic link**, or symlink, is a small file that points to another file or folder. Opening the link opens whatever it points to, so programs don't need to know it's there.

```bash
ln -s TARGET LINKNAME
```

`ln` makes links, and `-s` makes them symbolic. The target comes first, then the new link's name, in the same order as `cp`.

`ls -l` shows where a link points:

```text
lrwxrwxrwx 1 ranger ranger 26 Nov 15 06:00 today.log -> daily/2026-11-15.log
```

The `l` at the start marks a link. A relative target is resolved from the link's own folder, not from where you ran `ln`, so the safest target is an absolute path. Deleting the link leaves the target alone. Deleting the target leaves a broken link behind.

## Hints

1. The target is the dated file, and the link name is `~/logs/today.log`.
2. Run `ln -s ~/logs/daily/2026-11-15.log ~/logs/today.log`.
3. Check with `ls -l logs`, then `cat logs/today.log`.

## Setup

```bash
mkdir -p logs/daily
for day in 12 13 14 15; do
  echo "2026-11-$day 06:00 KR-RELAY-1 relay started" > "logs/daily/2026-11-$day.log"
done
echo "2026-11-15 06:42 KR-RELAY-4 antenna mount replaced" >> logs/daily/2026-11-15.log
```

## Checks

```python
check("~/logs/today.log is a symbolic link", lambda: os.path.islink(_full("~/logs/today.log")), "Make it with ln -s.")
expect(
    "The link points to 2026-11-15.log",
    lambda: _short(os.path.realpath(_full("~/logs/today.log"))),
    "~/logs/daily/2026-11-15.log",
    "Give ln -s the target first, then the link's name. An absolute target is safest.",
)
check("You read the log through the link", lambda: any("today.log" in arguments for arguments in calls("cat") + calls("less") + calls("tail") + calls("head")), "cat logs/today.log.")
```

## Solution

```bash
ln -s ~/logs/daily/2026-11-15.log ~/logs/today.log
ls -l logs
cat logs/today.log
```

## Restored

`~/logs/today.log`, the same name every day. Tomorrow's operator will point it at tomorrow's file, and everything that reads it will follow.
