---
id: set-the-power
kind: terminal
title: Set the beacon's power
system: Relay services
symbol: equipment
scene: files
skills: programs
---

## Briefing

The beacon program reads its power level from the environment, not from its arguments, so the same program can run quietly by day and loudly in a storm. There's a storm coming. Nobody should have to edit the program to turn the beacon up.

## Objective

Run `~/scripts/beacon.py` with the environment variable `BEACON_POWER` set to `high`. Don't change the program.

## Concept

The variables you made in the first hut were **shell variables**: they belong to the shell, and the programs it starts can't see them. To hand a variable to programs, `export` it:

```bash
export STATION=north
```

Now `STATION` is an **environment variable**. Every program the shell starts from now on gets a copy of it. `env` lists every environment variable, and some are already set for you: `HOME` is your home folder, `USER` is your user name.

For a single command, put the variable in front of it instead. It's set for that one program and nothing else:

```bash
STATION=south python3 scripts/report.py
```

A Python program reads environment variables from `os.environ`, a dictionary:

```python
import os
station = os.environ.get("STATION", "unknown")
```

## Hints

1. Look at the program first with `cat scripts/beacon.py`. It reads `BEACON_POWER` and falls back to `low`.
2. Either `export BEACON_POWER=high`, then run the program, or put `BEACON_POWER=high` at the start of the command.
3. `BEACON_POWER=high python3 scripts/beacon.py` should print `beacon power: high`.

## Setup

```bash
mkdir -p scripts relay
cat > scripts/beacon.py <<'EOF'
# Sets the beacon's transmit power. The level comes from the environment
# variable BEACON_POWER: low, normal, or high.
import os

power = os.environ.get("BEACON_POWER", "low")
if power not in ("low", "normal", "high"):
    print(f"unknown power level: {power}")
else:
    print(f"beacon power: {power}")
    with open(os.path.expanduser("~/relay/beacon.state"), "w") as state:
        state.write(power + "\n")
EOF
```

## Checks

```python
expect(
    "The beacon ran at high power",
    lambda: (read("~/relay/beacon.state") or "not run yet").strip(),
    "high",
    "Run the program with BEACON_POWER set to high in its environment.",
)
check(
    "beacon.py still takes its power level from the environment",
    lambda: 'power = os.environ.get("BEACON_POWER", "low")' in (read("~/scripts/beacon.py") or ""),
    "Set the power through the environment instead of editing the program. Start over to get the original back.",
)
```

## Solution

```bash
export BEACON_POWER=high
python3 scripts/beacon.py
```

## Restored

The beacon steps up to high power just as the first gusts hit the ridge. Tomorrow, `BEACON_POWER=normal` turns it back down.
