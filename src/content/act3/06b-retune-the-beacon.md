---
id: retune-the-beacon
kind: terminal
title: Retune the beacon
system: Relay scripts
symbol: controller
scene: files
skills: programs
---

## Briefing

The south beacon's settings file still says 147.360. The winter frequency is 147.330. There's no editor window out here, but the terminal has one built in: `nano`.

## Objective

Open `~/relay/config/beacon.conf` in `nano`, change the frequency to `147.330`, save the file, and exit. Leave the other lines as they are.

## Concept

`nano` is a text editor that runs inside the terminal:

```bash
nano relay/config/beacon.conf
```

It opens the file, or a new empty file if there's nothing there yet. Move around with the arrow keys and type to edit, as in any editor. The bottom two lines list nano's commands, where `^` means the **Ctrl** key:

| Keys | Does |
|---|---|
| Ctrl+O, then Enter | Save ("write **O**ut") under the name shown |
| Ctrl+X | Exit. If there are unsaved changes, nano asks: press `Y` to save or `N` to discard |
| Ctrl+K | Cut the current line |
| Ctrl+U | Paste it back |

While nano is open, your keys go to nano, not the shell. The prompt comes back when you exit.

## Hints

1. Run `nano relay/config/beacon.conf` from your home folder.
2. Use the arrow keys to reach the end of the `frequency=` line, delete `360` with Backspace, and type `330`.
3. Press Ctrl+O, then Enter to save, then Ctrl+X to exit. `cat` the file to check it.

## Setup

```bash
mkdir -p relay/config
printf 'beacon=south\nfrequency=147.360\npower=low\n' > relay/config/beacon.conf
```

## Checks

```python
expect(
    "beacon.conf sets the frequency to 147.330",
    lambda: [line for line in (read("~/relay/config/beacon.conf") or "").splitlines() if line.startswith("frequency")],
    ["frequency=147.330"],
    "Change the frequency line to exactly frequency=147.330, then save with Ctrl+O and Enter.",
)
check(
    "The other settings are unchanged",
    lambda: [line for line in (read("~/relay/config/beacon.conf") or "").splitlines() if not line.startswith("frequency")] == ["beacon=south", "power=low"],
    "Only the frequency line should change. Start over to get the original file back.",
)
```

## Solution

```bash
# In the terminal this is done in nano. sed makes the same change without
# opening an editor, so the tests can run it unattended.
sed -i 's/147.360/147.330/' relay/config/beacon.conf
```

## Restored

The south beacon steps down to 147.330, and the two masts finally sing the same note.
