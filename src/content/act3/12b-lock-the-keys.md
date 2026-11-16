---
id: lock-the-keys
kind: terminal
title: Lock up the radio keys
system: Relay security
symbol: controller
scene: console
skills: permissions
---

## Briefing

Your copy of the radio keys is sitting in `~/relay` where any user on the relay can read it. And somebody left the handbook open for everyone to change, so anyone could rewrite the procedures. Time to fix both.

## Objective

In `~/relay`:

- Make `radio-keys.txt` readable and writable by you, and nobody else: `rw-------`.
- Make `handbook.txt` readable by everyone but writable only by you: `rw-r--r--`.

## Concept

The permission string in `ls -l` is three groups of three letters:

```text
rw- r-- r--
 │   │   └ others: everyone else
 │   └ group: users in the file's group
 └ user: the file's owner
```

In each group, `r` means **read**, `w` means **write** (change), and `x` means **execute** (run). A `-` means that permission is off.

`chmod` (**ch**ange **mod**e) changes them. One way is by letters: who (`u`, `g`, `o`, or `a` for all), then `+`, `-`, or `=`, then permissions:

```bash
chmod go-w notes.txt
chmod u=rw,go= secret.txt
```

The first takes write away from group and others. The second sets the owner to `rw` and group and others to nothing.

The other way is by numbers, one digit per group, adding `r=4`, `w=2`, `x=1`: `chmod 644` is `rw-r--r--`, `600` is `rw-------`, and `755` is `rwxr-xr-x`.

## Hints

1. `ls -l relay` shows where both files start.
2. `chmod 600 relay/radio-keys.txt`, or `chmod go= relay/radio-keys.txt`.
3. `chmod 644 relay/handbook.txt`, or `chmod go-w relay/handbook.txt`. Check with `ls -l relay`.

## Setup

```bash
mkdir -p relay
echo "radio keys: 7731 5521 4419" > relay/radio-keys.txt
echo "Relay handbook: reset with standby code 4-1-9." > relay/handbook.txt
chmod 644 relay/radio-keys.txt
chmod 666 relay/handbook.txt
```

## Checks

```python
expect("radio-keys.txt is rw-------", lambda: mode("~/relay/radio-keys.txt"), "rw-------", "Take every permission away from group and others.")
expect("handbook.txt is rw-r--r--", lambda: mode("~/relay/handbook.txt"), "rw-r--r--", "Take write away from group and others, and leave read.")
```

## Solution

```bash
chmod 600 relay/radio-keys.txt
chmod go-w relay/handbook.txt
ls -l relay
```

## Restored

The keys are yours alone, and the handbook is readable by everyone and changeable only by you. That's how it should have been from the start.
