---
id: bring-the-line-online
kind: terminal
title: Bring the line online
system: Valley relay
symbol: controller
scene: files
skills: filesystem, reading-files, programs, streams
assessment: true
---

## Briefing

`KR-RELAY-6` is the last hut before the valley, and it's dark. Until it starts, nothing you've repaired on the line reaches anyone. Its disk has been copied into `~/relay6` for you: its settings, its start program, and three days of logs.

This is an independent mission. There's no step-by-step lesson, and hints unlock after your second submission. Use what you've learned on the relay line, and look things up with `--help` and `man` when you need to.

## Objective

1. Every relay on the line uses the frequency `147.330`. One of the config files in `~/relay6/config` says otherwise. Find it and fix it, changing nothing else.
2. The start program, `~/relay6/bin/start-relay`, won't run. Make it runnable, then run it. It refuses to start while any setting is wrong.
3. Write a report at `~/reports/relay6.txt` that contains every `FAULT` line from the logs in `~/relay6/logs`, and nothing else.
4. Report how many `FAULT` lines there are in total.

## Concept

This mission brings together the whole relay line:

| You need to | Reach for |
|---|---|
| Find which file says something | `grep`, with `-r` for a folder |
| Change a file | `nano` |
| Run a program file | `chmod +x`, then its path |
| Save a command's output | `>` |
| Count lines | `| wc -l` |

`grep` puts the file name in front of each match when it searches several files. The report should hold the log lines themselves. `grep --help` lists an option that leaves the names out.

## Hints

1. `grep -r frequency relay6/config` shows every frequency setting and which file it's in.
2. `start-relay` has no execute permission. After `chmod +x`, run it from your home folder as `relay6/bin/start-relay`.
3. `grep -h FAULT relay6/logs/*.log > reports/relay6.txt` writes the report without file names, and `wc -l reports/relay6.txt` counts it.

## Setup

```bash
mkdir -p relay6/config relay6/bin relay6/logs reports
printf 'callsign=KR-RELAY-6\nfrequency=147.330\nmode=narrow\n' > relay6/config/radio.conf
printf 'beacon=valley\nfrequency=147.390\npower=normal\n' > relay6/config/beacon.conf
printf 'backup=on\nfrequency=147.330\n' > relay6/config/backup.conf
printf 'interval=120\n' > relay6/config/heartbeat.conf
cat > relay6/bin/start-relay <<'EOF'
#!/bin/sh
# Starts KR-RELAY-6, after checking every frequency setting.
cd "$(dirname "$0")/.." || exit 2
bad=$(grep -h '^frequency=' config/*.conf | grep -v '^frequency=147.330$')
if [ -n "$bad" ]; then
  echo "start-relay: refusing to start, wrong setting: $bad" >&2
  exit 1
fi
mkdir -p state
echo "online since $(date +%H:%M)" > state/online
echo "KR-RELAY-6 online"
EOF
chmod 644 relay6/bin/start-relay
python3 - <<'EOF'
for day in (13, 14, 15):
    lines = []
    for i in range(120):
        stamp = f"2026-11-{day} {6 + i // 10:02d}:{i % 10 * 6:02d}"
        if (i * 11 + day) % 41 == 0:
            lines.append(f"{stamp} KR-RELAY-6 FAULT link to valley lost")
        elif i % 17 == 3:
            lines.append(f"{stamp} KR-RELAY-6 WARN signal weak, no fault yet")
        else:
            lines.append(f"{stamp} KR-RELAY-6 INFO heartbeat ok")
    open(f"relay6/logs/2026-11-{day}.log", "w").write("\n".join(lines) + "\n")
EOF
```

## Report

How many FAULT lines are there in total?

```text
9
```

## Checks

```python
# Only the relay's own files count, so a backup copy made along the way is fine.
CONFIG = ["backup.conf", "beacon.conf", "heartbeat.conf", "radio.conf"]


def setting_lines(name):
    return (read(f"~/relay6/config/{name}") or "").splitlines()


check(
    "Every config file sets frequency=147.330",
    lambda: all(line == "frequency=147.330" for name in CONFIG for line in setting_lines(name) if line.startswith("frequency")),
    "Search the config folder for frequency, and fix the file that differs.",
)
check(
    "Nothing else in the config changed",
    lambda: [line for name in CONFIG for line in setting_lines(name) if not line.startswith("frequency")]
    == ["backup=on", "beacon=valley", "power=normal", "interval=120", "callsign=KR-RELAY-6", "mode=narrow"],
    "Change only the wrong frequency line. Start over to get the original files back.",
)
check("start-relay is executable", lambda: "x" in mode("~/relay6/bin/start-relay")[:3], "Give it execute permission with chmod.")
check(
    "KR-RELAY-6 is online",
    lambda: (read("~/relay6/state/online") or "").startswith("online since"),
    "Run start-relay once the settings are right. Read what it prints if it refuses.",
)
faults = sorted(
    line
    for day in (13, 14, 15)
    for line in (read(f"~/relay6/logs/2026-11-{day}.log") or "").splitlines()
    if " FAULT " in line
)
expect(
    "The report holds every FAULT line, and nothing else",
    lambda: sorted(re.sub(r"^[^ ]*\.log:", "", line) for line in (read("~/reports/relay6.txt") or "").splitlines()),
    faults,
    "Search every log for FAULT, and save the output to ~/reports/relay6.txt with >.",
    reveal=False,
)
expect("You reported the number of FAULT lines", answer(), "9", "Count the lines in your report.", reveal=False)
```

## Solution

```bash
grep -r frequency relay6/config
sed -i 's/147.390/147.330/' relay6/config/beacon.conf
chmod +x relay6/bin/start-relay
relay6/bin/start-relay
grep -h FAULT relay6/logs/*.log > reports/relay6.txt
wc -l reports/relay6.txt
```

## Restored

`KR-RELAY-6 online`. For the first time this winter, a message from Kestrel Ridge reaches the valley, and the valley answers. The relay line is whole.
