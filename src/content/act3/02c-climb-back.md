---
id: climb-back
kind: terminal
title: Climb back out
system: Signal room
symbol: instrument
scene: files
skills: filesystem
---

## Briefing

Last year's north beacon is filed away in `archive`, three folders down. The south mast's recording sits on a different branch: back up past `north`, then down into `south`. You don't have to go all the way home to cross over.

## Objective

Go to `~/signals/north/archive`. Then, from there, move to `~/signals/south` with a **single** `cd` command that uses `..`.

## Concept

Every folder has a **parent**: the folder that contains it. `..` is the name for the parent, wherever you are:

```bash
cd ..
```

goes up one folder. `..` works inside longer paths too, so `cd ../south` goes up one folder and then down into `south`. And `../..` goes up two.

```text
~
└── signals
    ├── north
    │   └── archive
    └── south
```

From `archive`, `..` is `north`, and `../..` is `signals`. So `../../south` reaches `south` without going home first.

There's also `.`, which means the folder you're in. You'll see it in commands like `ls .`, which lists the current folder.

## Hints

1. First get to the archive: `cd signals/north/archive` from your home folder.
2. From the archive, count the levels: one `..` reaches `north`, and a second reaches `signals`.
3. Run `cd ../../south`. The prompt should end in `~/signals/south$`.

## Setup

```bash
mkdir -p logs manuals signals/north/archive signals/south
echo "Handover: the south beacon drifted again. Check the signals folder." > handover.txt
echo "06:00 relay started" > logs/relay.log
echo "Relay manual, winter edition" > manuals/relay-manual.txt
echo "beacon north 147.330" > signals/north/beacon.sig
echo "beacon north 147.300 (last year)" > signals/north/archive/beacon-old.sig
echo "beacon south 147.360" > signals/south/beacon.sig
```

## Checks

```python
check(
    "You crossed from the archive to south in one cd",
    lambda: any(path.rstrip("/") in ("../../south", "./../../south") for path in calls("cd")),
    "From ~/signals/north/archive, go up two folders and then into south, all in one path.",
)
expect(
    "The terminal is in ~/signals/south",
    cwd,
    "~/signals/south",
    "The prompt should end in ~/signals/south$.",
)
```

## Solution

```bash
cd signals/north/archive
cd ../../south
```

## Restored

Side by side, the recordings tell the story: the north beacon holds 147.330, the south has drifted to 147.360. Somebody will have to retune it, but first the radio settings.
