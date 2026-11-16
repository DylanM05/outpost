---
id: into-the-signals
kind: terminal
title: Into the signals
system: Signal room
symbol: instrument
scene: files
skills: filesystem
---

## Briefing

The handover note says the south beacon drifted again, but the beacons are recorded mast by mast, and the north mast's recording is the one to compare against. It's in the `north` folder, inside `signals`.

## Objective

Move the terminal into the `signals` folder, then into the `north` folder inside it, and list what's there. Leave the terminal in `~/signals/north`.

## Concept

`cd` (**c**hange **d**irectory) moves the terminal into another folder:

```bash
cd logs
```

The prompt shows the new working directory, `~/logs`, and the map marks it.

A path that doesn't start with `/` is **relative**: it starts from the folder you're in. `cd logs` works from your home folder because `logs` is inside it. From somewhere else, there's no `logs` folder to move into, and `cd` says so.

A relative path can go several folders deep in one step. From your home folder, `cd manuals/old` would go into `manuals`, then into `old` inside it.

`cd` on its own, with no path, always takes you home.

## Hints

1. Run `cd signals`, then `ls` to see what's inside.
2. Now go one folder deeper with `cd north`, and run `ls` again.
3. You can also go both levels at once with `cd signals/north`. The prompt should end in `~/signals/north$`.

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
check("You used cd", ran("cd"), "Type cd, a space, and the folder to move into.")
check("You listed a folder with ls", ran("ls"), "Run ls to see what's inside the folder you're in.")
expect(
    "The terminal is in ~/signals/north",
    cwd,
    "~/signals/north",
    "The prompt shows where the terminal is. It should end in ~/signals/north$.",
)
```

## Solution

```bash
cd signals
ls
cd north
ls
```

## Restored

The north beacon's recording plays: 147.330, steady as a clock. Now there's something to measure the south beacon against.
