---
id: take-it-back
kind: terminal
title: Take back your notes
system: Relay security
symbol: controller
scene: console
skills: permissions
---

## Briefing

Last night someone ran a repair script as root, and it rewrote your shift notes. The notes are still in your home folder, but they belong to root now, and you can't add to them. Make them yours again.

## Objective

Make `~/relay/shift-notes.txt` belong to you again, with `sudo chown`. Then add the line `antenna checked` to the end of it, as yourself, without `sudo`.

## Concept

`chown` (**ch**ange **own**er) gives a file to another user:

```bash
sudo chown ranger notes.txt
```

Only root can give files away, so it needs `sudo`. Change the group at the same time with `user:group`, as in `chown ranger:ranger notes.txt`.

Files owned by root turning up in a home folder is a common mess. It happens when someone runs a program with `sudo` that writes there. The fix is to take the file back, rather than doing everything that touches it with `sudo` from then on.

## Hints

1. `ls -l relay` shows the notes are owned by root.
2. `sudo chown ranger:ranger relay/shift-notes.txt`, with your password, `outpost`.
3. Then `echo "antenna checked" >> relay/shift-notes.txt`, with no `sudo`.

## Root setup

```bash
mkdir -p /home/ranger/relay
chown ranger:ranger /home/ranger/relay
printf 'shift notes, KR-RELAY-1\nbeacon retuned to 147.330\n' > /home/ranger/relay/shift-notes.txt
chown root:root /home/ranger/relay/shift-notes.txt
chmod 644 /home/ranger/relay/shift-notes.txt
```

## Checks

```python
expect("shift-notes.txt belongs to you", lambda: owner("~/relay/shift-notes.txt"), "ranger", "Give it back to ranger with sudo chown.")
expect(
    "The notes end with your new line",
    lambda: read("~/relay/shift-notes.txt"),
    "shift notes, KR-RELAY-1\nbeacon retuned to 147.330\nantenna checked\n",
    "Append antenna checked with echo and >>, after taking the file back.",
)
check(
    "You added the line as yourself",
    lambda: any(">>" in line and "shift-notes" in line and "sudo" not in line for line in history()) or ran("nano"),
    "Once the file is yours, you don't need sudo to change it.",
)
```

## Solution

```bash
echo outpost | sudo -S -p "" chown ranger:ranger relay/shift-notes.txt
echo "antenna checked" >> relay/shift-notes.txt
```

## Restored

Your notes are yours again, and the next repair script will run as you, not as root.
