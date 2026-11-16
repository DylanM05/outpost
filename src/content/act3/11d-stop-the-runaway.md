---
id: stop-the-runaway
kind: terminal
title: Stop the runaway beacon
system: Operator's bunk
symbol: instrument
scene: console
skills: programs
---

## Briefing

Somebody started a test beacon in the background and went off shift. It's still running, filling the radio log with test pings every second. There's no window to close: it's a **process**, a running program, and you'll have to find it and stop it.

## Objective

Find the running `test-beacon` process, and stop it with `kill`.

## Concept

Every running program is a **process**, and each one has a number, its **process ID** or **PID**.

- `ps` lists processes. `ps -ef` lists every process on the machine, with its PID and the command that started it.
- `top` shows processes live, busiest first. Press `q` to quit.
- `kill PID` asks the process with that PID to stop. A process that won't stop can be forced with `kill -9 PID`, as a last resort.

For a program running in your own terminal, you don't need its PID: **Ctrl+C** interrupts whatever is running in the foreground and brings the prompt back. It's the first thing to try when a command won't finish.

To find a process by name, filter the list: `ps -ef | grep beacon`. The `grep` itself shows up in the results too, because it's running while `ps` lists processes.

## Hints

1. `ps -ef | grep test-beacon` shows the process. The PID is the second column on its line.
2. Run `kill` followed by that number.
3. Check with the same `ps` command: only the `grep` line should be left.

## Setup

```bash
mkdir -p relay
cat > relay/test-beacon <<'EOF'
#!/bin/sh
# Pings the radio log every second, forever.
while true; do
  echo "$(date +%T) test ping" >> "$HOME/relay/radio.log"
  sleep 1
done
EOF
chmod +x relay/test-beacon
setsid relay/test-beacon > /dev/null 2>&1 < /dev/null &
```

## Checks

```python
def beacons():
    return [pid for pid, comm, tty in _processes() if "test-beacon" in (read(f"/proc/{pid}/cmdline") or "")]


check("test-beacon isn't running any more", lambda: not beacons(), "Find its PID with ps -ef | grep test-beacon, then kill it.")
check("You stopped it with kill", lambda: ran("kill") or ran("pkill") or ran("killall"), "Use kill with the process's PID.")
```

## Solution

```bash
ps -ef | grep test-beacon
# A player reads the PID from ps and types it. pgrep looks it up unattended.
kill $(pgrep -f test-beacon)
ps -ef | grep test-beacon
```

## Restored

The pings stop mid-second. The radio log goes quiet, and the real traffic is readable again.
