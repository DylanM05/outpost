---
id: clear-the-junk
kind: terminal
title: Clear out the junk
system: Spares bay
symbol: controller
scene: files
skills: filesystem
---

## Briefing

The spares bay's storage is nearly full. Most of the space goes to a folder of scrap from old repairs and a scratch file someone left behind. Everything else in the bay is a record somebody still needs.

## Objective

In `~/bay`, delete the file `scratch.tmp` and the whole `scrap` folder. Leave everything else exactly as it is.

## Concept

`rm` (**r**e**m**ove) deletes files:

```bash
rm old.txt
```

There's no wastebasket in the terminal: a removed file is gone for good. That's why `rm` is the command to slow down for.

`rm` won't delete a folder on its own. `rm -r scrap` (**r**ecursive) deletes the folder and everything inside it, folders within folders included. `rmdir` deletes a folder only if it's already empty, which makes it the safer choice when you expect a folder to be empty.

Two habits that save mistakes:

- Run `ls` on what you're about to delete first, to see exactly what will go.
- Add `-i` to have `rm` ask before deleting each file.

## Hints

1. `cd bay`, then `ls` to see what's there.
2. `rm scratch.tmp` deletes the file.
3. `rm -r scrap` deletes the folder and everything in it. Check with `ls` afterwards.

## Setup

```bash
mkdir -p bay/scrap/old-mounts bay/scrap/cables bay/records
echo "cracked, do not use" > bay/scrap/old-mounts/mount-1.part
echo "cracked, do not use" > bay/scrap/old-mounts/mount-2.part
echo "frayed" > bay/scrap/cables/cable-3.part
echo "temporary notes" > bay/scratch.tmp
echo "2026-11-12 antenna mount fitted to KR-RELAY-4" > bay/records/repairs.log
echo "keep: tools are signed out here" > bay/signout.txt
```

## Checks

```python
check("scratch.tmp is gone", lambda: not exists("~/bay/scratch.tmp"), "Delete it with rm.")
check("The scrap folder is gone", lambda: not exists("~/bay/scrap"), "Delete a folder and its contents with rm -r.")
check(
    "The repair records and the sign-out sheet are still there",
    lambda: read("~/bay/records/repairs.log") is not None and is_file("~/bay/signout.txt"),
    "Only scratch.tmp and scrap should go. Start over to get the deleted files back.",
)
```

## Solution

```bash
cd bay
ls
rm scratch.tmp
rm -r scrap
ls
```

## Restored

The scrap is gone, the records stay. The bay has room again for the spares that matter.
