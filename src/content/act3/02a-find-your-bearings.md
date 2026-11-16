---
id: find-your-bearings
kind: terminal
title: Find your bearings
system: Signal room
symbol: instrument
scene: files
skills: filesystem
---

## Briefing

The signal room is where the relay keeps everything it knows: its logs, its manuals, and the signals it has recorded. All of it is stored as files and folders, and the terminal is the only way in. Before you touch anything, find out where you are.

## Objective

Run `pwd` to see which folder the terminal is in, and `ls` to list what's inside that folder. Then report the full path of your home folder.

## Concept

A computer keeps its files in a **filesystem**: a tree of **folders**, also called **directories**, that hold files and more folders. On Linux the whole tree grows from one folder, the **root**, written `/`.

The terminal is always *in* one folder, called its **working directory**. Commands work there unless you tell them otherwise.

- `pwd` (**p**rint **w**orking **d**irectory) shows the full path of that folder.
- `ls` (**l**i**s**t) shows what's inside it. Folders show in blue, and plain files aren't colored.

A **path** names a spot in the tree, folder by folder, separated by `/`. `/home/ranger` means the folder `ranger`, inside the folder `home`, inside the root.

Every user has a **home folder** for their own files. The shell writes it as `~` for short, which is why the prompt says `~`.

The panel on the right maps your home folder and marks where the terminal is.

## Hints

1. Type `pwd` and press Enter. It prints a single line: a path.
2. Then run `ls` to see the folders and files in your home folder.
3. Copy the path that `pwd` printed into the report box. It starts with `/`.

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

What's the full path of your home folder?

```text
/home/ranger
```

## Checks

```python
check("You ran pwd", ran("pwd"), "Type pwd and press Enter.")
check("You ran ls", ran("ls"), "Type ls and press Enter to list the folder.")
expect(
    "You reported your home folder's full path",
    answer().rstrip("/"),
    "/home/ranger",
    "Copy the line pwd prints. A full path starts with /, where ~ is only shorthand.",
    reveal=False,
)
```

## Solution

```bash
pwd
ls
```

## Restored

Now you know the lay of the land: three folders and a handover note, all in `/home/ranger`. The signal room's lights come up one by one.
