---
id: back-it-up
kind: terminal
title: Back up the settings
system: Spares bay
symbol: controller
scene: files
skills: filesystem
---

## Briefing

Before anyone retunes the south beacon, its settings need a backup. If the new frequency is wrong, the crew can put the old file straight back. The spares bay also keeps a copy of every relay's whole configuration, one folder per day.

## Objective

In `~/relay`:

- Copy `config/beacon.conf` to `config/beacon.conf.bak`.
- Copy the whole `config` folder to `~/backups/config-2026-11-15`.

## Concept

`cp` (**c**o**p**y) copies a file. The original stays where it was:

```bash
cp radio.conf radio.conf.old
```

Like `mv`, copying into an existing folder keeps the name: `cp radio.conf backups` makes `backups/radio.conf`.

`cp` won't copy a folder on its own. Add `-r` (**r**ecursive) to copy a folder and everything in it:

```bash
cp -r config config-copy
```

If the destination folder doesn't exist, it becomes the copy. If it already exists, the copy goes inside it.

## Hints

1. Start with `cd relay`.
2. `cp config/beacon.conf config/beacon.conf.bak` makes the backup next to the original.
3. `cp -r config ~/backups/config-2026-11-15` copies the whole folder. The `backups` folder already exists.

## Setup

```bash
mkdir -p relay/config backups
printf 'beacon=south\nfrequency=147.360\npower=low\n' > relay/config/beacon.conf
printf 'callsign=KR-RELAY-1\nmode=narrow\n' > relay/config/radio.conf
printf 'interval=120\n' > relay/config/heartbeat.conf
```

## Checks

```python
check(
    "config/beacon.conf.bak is a copy of beacon.conf",
    lambda: read("~/relay/config/beacon.conf.bak") == "beacon=south\nfrequency=147.360\npower=low\n",
    "Copy beacon.conf to beacon.conf.bak, in the same folder.",
)
check(
    "The original beacon.conf is still there",
    lambda: read("~/relay/config/beacon.conf") == "beacon=south\nfrequency=147.360\npower=low\n",
    "Use cp, not mv, so the original stays.",
)
expect(
    "~/backups/config-2026-11-15 holds the whole config folder",
    lambda: listing("~/backups/config-2026-11-15"),
    ["beacon.conf", "beacon.conf.bak", "heartbeat.conf", "radio.conf"],
    "Copy the folder itself with cp -r config ~/backups/config-2026-11-15, after making the .bak file.",
)
```

## Solution

```bash
cd relay
cp config/beacon.conf config/beacon.conf.bak
cp -r config ~/backups/config-2026-11-15
```

## Restored

Two copies, one next to the original and one in the bay's backups. Whatever happens to the beacon now, nothing about it is lost.
