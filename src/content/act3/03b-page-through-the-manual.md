---
id: page-through-the-manual
kind: terminal
title: Page through the manual
system: Log store
symbol: instrument
scene: files
skills: reading-files
---

## Briefing

When a relay's link drops, the manual says to hold it in standby with a code before restarting it. The manual is long, the code is buried in the middle of it, and neither end of the file is any help.

## Objective

Open `~/manuals/relay-manual.txt` in `less`, search it for the reset procedure, and report the standby code.

## Concept

`less` shows a file one screen at a time, starting at the top, and lets you move around in it:

| Key | Does |
|---|---|
| Space, or `f` | Next screen |
| `b` | Previous screen |
| Up and Down arrows | One line at a time |
| `/` then a word, then Enter | Search forward for the word |
| `n` | Next match |
| `q` | Quit, back to the prompt |

```bash
less manuals/relay-manual.txt
```

While `less` is open, your keys go to `less`, not the shell. Press `q` to get the prompt back. You'll see `less` again: it's the program that shows manual pages.

## Hints

1. Run `less manuals/relay-manual.txt` from your home folder.
2. Type `/reset` and press Enter to jump to the first match. Press `n` for the next one if it isn't the procedure.
3. The procedure gives a standby code: three numbers separated by dashes. Press `q` to leave `less`, then report it.

## Setup

```bash
mkdir -p manuals
python3 - <<'EOF'
sections = [
    ("INTRODUCTION", "This manual covers the KR-series relay used along the Kestrel Ridge line."),
    ("SAFETY", "Never open the mast housing in a lightning storm. Ground the mast before any work."),
    ("POWER", "The relay draws power from its own panel and battery. A full battery lasts four days."),
    ("ANTENNA", "Check the antenna mount for ice after every storm. A loose mount detunes the beacon."),
    ("BEACON", "The beacon transmits on the frequency set in the channel settings file."),
    ("LOGS", "The relay writes a heartbeat line to its log every two minutes."),
    ("RESET PROCEDURE", "If the link drops, hold the relay in standby before restarting it.\nEnter standby code 4-1-9 at the panel, wait one minute, then restart."),
    ("WINTER CARE", "Clear snow from the panel daily. A buried panel cannot charge the battery."),
    ("SPARE PARTS", "Spare parts are kept in the supply locker. Log every part you take."),
    ("CONTACTS", "Report faults to the outpost on the next scheduled call."),
]
lines = ["KR-SERIES RELAY MANUAL", "Winter edition", ""]
for number, (title, body) in enumerate(sections, 1):
    lines += [f"{number}. {title}", ""]
    for paragraph in range(5):
        lines += body.split("\n") if paragraph == 2 else [f"Section {number}, note {paragraph + 1}: see the outpost handbook for details."]
        lines.append("")
open("manuals/relay-manual.txt", "w").write("\n".join(lines))
EOF
```

## Report

What's the standby code in the reset procedure?

```text
4-1-9
```

## Checks

```python
check("You opened the manual in less", ran("less"), "Run less followed by the path to the manual.")
expect(
    "You reported the standby code",
    answer(),
    "4-1-9",
    "Search for the reset procedure with /reset, and read the code from it.",
    accept=lambda given: given.replace(" ", "") in ("4-1-9", "419"),
    reveal=False,
)
```

## Solution

```bash
# In the terminal, less waits for keys: /reset, Enter, q. When its output goes
# to another program instead of the screen, less just prints the file, which
# lets the tests run this unattended.
less manuals/relay-manual.txt | grep -A 1 "hold the relay"
```

## Restored

Standby code 4-1-9, then a minute's wait. The procedure goes on a card by the relay panel, where the next operator won't have to search for it.
