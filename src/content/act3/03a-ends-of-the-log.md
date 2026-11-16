---
id: ends-of-the-log
kind: terminal
title: Read the ends of the log
system: Log store
symbol: instrument
scene: files
skills: reading-files
---

## Briefing

The relay writes a line to its log every couple of minutes, and the log runs to hundreds of lines. Somewhere near the end, the link to the valley dropped. Printing the whole thing with `cat` would scroll the part you need straight past.

## Objective

Use `tail` to look at the end of `~/logs/relay.log`, and report the time of the very last entry.

## Concept

`cat` prints a whole file, which is fine for a few lines. For a long file, the start scrolls away before you can read it, so look at just one end:

- `head` prints the first 10 lines of a file.
- `tail` prints the last 10.

```bash
head logs/relay.log
```

Both take an **option** that changes how many lines they print. Options start with `-` and go before the file name:

```bash
tail -n 3 logs/relay.log
```

prints the last 3 lines. Most commands have options. You'll meet many more of them.

## Hints

1. Run `tail logs/relay.log` from your home folder.
2. The last line it prints is the last entry. Each entry starts with a date and a time.
3. Report just the time from the last line, written like `hh:mm:ss`.

## Setup

```bash
mkdir -p logs
python3 - <<'EOF'
from datetime import datetime, timedelta
t = datetime(2026, 11, 14, 6, 0, 0)
lines = [f"{t:%Y-%m-%d %H:%M:%S} KR-RELAY-1 relay started"]
for i in range(1, 640):
    t += timedelta(seconds=127 + (i * 37) % 11)
    lines.append(f"{t:%Y-%m-%d %H:%M:%S} KR-RELAY-1 heartbeat ok, signal {60 + (i * 7) % 23}%")
t += timedelta(seconds=83)
lines.append(f"{t:%Y-%m-%d %H:%M:%S} KR-RELAY-1 link to KR-RELAY-2 lost")
open("logs/relay.log", "w").write("\n".join(lines) + "\n")
EOF
```

## Report

At what time was the last entry written?

```text
05:27:10
```

## Checks

```python
check("You used tail", ran("tail"), "Run tail followed by the path to the log.")
expect(
    "You reported the time of the last entry",
    answer(),
    "05:27:10",
    "It's on the last line tail prints, after the date.",
    accept=lambda given: given in ("05:27:10", "05:27"),
    reveal=False,
)
```

## Solution

```bash
tail logs/relay.log
```

## Restored

`05:27:10`: link to `KR-RELAY-2` lost. Now the crew knows when the line went quiet, and can match it against the weather log.
