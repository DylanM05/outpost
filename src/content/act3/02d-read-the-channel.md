---
id: read-the-channel
kind: terminal
title: Read the channel settings
system: Signal room
symbol: instrument
scene: files
skills: filesystem
---

## Briefing

The relay's radio settings aren't in your home folder at all. They belong to the whole machine, so they live in `/srv/relay/radio`, and there are two files there with long, similar names. The beacon should be on the winter frequency.

## Objective

Use `cat` to print the winter settings file in `/srv/relay/radio`, then report the frequency it gives.

## Concept

A path that starts with `/` is **absolute**: it starts at the root, so it means the same place no matter where the terminal is. `/srv/relay/radio` works from your home folder, from `~/signals/south`, from anywhere.

A **relative** path, one without the leading `/`, starts from the working directory instead. `~` is really an absolute path in disguise: the shell turns it into `/home/ranger`.

`cat` prints a file's contents:

```bash
cat /srv/relay/radio/some-file.conf
```

Long names are tedious to type, so let the shell finish them. Type the first few letters of a file or folder and press **Tab**: the shell completes the name. If more than one name fits, it completes as far as it can, and pressing **Tab** twice lists the choices.

## Hints

1. Start with `ls /srv/relay/radio` to see the two file names.
2. Type `cat /srv/relay/radio/ch` and press Tab, then type `w` for winter and press Tab again.
3. Run `cat /srv/relay/radio/channel-settings-winter.conf`, then copy the number after `frequency=` into the report box.

## Root setup

```bash
mkdir -p /srv/relay/radio
printf 'callsign=KR-RELAY-1\nfrequency=147.330\nmode=narrow\npower=low\n' > /srv/relay/radio/channel-settings-winter.conf
printf 'callsign=KR-RELAY-1\nfrequency=146.940\nmode=wide\npower=high\n' > /srv/relay/radio/channel-settings-summer.conf
```

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

## Report

What frequency does the winter settings file give?

```text
147.330
```

## Checks

```python
check("You read a file with cat", ran("cat"), "Run cat followed by the path to the file.")
expect(
    "You reported the winter frequency",
    answer(),
    "147.330",
    "It's the number after frequency= in channel-settings-winter.conf.",
    accept=lambda given: given.replace("MHz", "").strip() == "147.330",
    reveal=False,
)
```

## Solution

```bash
ls /srv/relay/radio
cat /srv/relay/radio/channel-settings-winter.conf
```

## Restored

147.330, the same frequency the north beacon holds. The south beacon is the one that's wrong, and now you know what to set it to.
