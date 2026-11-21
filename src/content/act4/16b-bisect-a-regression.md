---
id: bisect-a-regression
kind: terminal
title: Hunt a regression with bisect
system: Forensic bench
symbol: instrument
scene: repo
repo: ~/meter
skills: git-history
---

## Briefing

`~/meter` contains a small power-meter module (`meter.py`) and a self-test (`python3 test_meter.py`). Twelve commits landed this week. At the very first commit (tagged `v0.1`), `python3 test_meter.py` passed. Right now on `main`, it fails.

Rather than checking every commit one by one, use **binary search on Git history** (`git bisect`) to pinpoint the exact first commit that broke `test_meter.py`.

## Objective

In `~/meter`:

1. Use `git bisect` between `v0.1` (good) and `HEAD` (bad) to locate the first commit where `python3 test_meter.py` fails.
2. Run `git bisect reset` when you're finished so `~/meter` returns cleanly to `main`.
3. Report the hash of the offending commit (at least 7 characters) in the box below.

## Concept

`git bisect` does binary search across commits — finding the exact breaking commit in 1,000 commits takes at most 10 checks (`log₂ N`).

You can drive it by hand:

```bash
git bisect start
git bisect bad HEAD
git bisect good v0.1
# Git checks out the midpoint. Test it:
python3 test_meter.py
# Tell Git `git bisect good` or `git bisect bad` until it prints the first bad commit!
git bisect reset
```

Or automate the entire search with `git bisect run`, giving it any command that exits `0` for good and non-zero for bad:

```bash
git bisect start HEAD v0.1
git bisect run python3 test_meter.py
git bisect reset
```

Always finish with `git bisect reset` so Git exits detached-HEAD bisect mode and returns to your branch.

## Hints

1. Run `git bisect start HEAD v0.1` inside `~/meter`.
2. Run `git bisect run python3 test_meter.py` (or step manually with `python3 test_meter.py` followed by `git bisect good` / `git bisect bad`).
3. Note the hash printed on the `<hash> is the first bad commit` line, run `git bisect reset`, and paste the first 7+ characters into the report box.

## Setup

```bash
player_git
mkdir meter
cd meter
git init -q
cat > meter.py <<'EOF'
SCALE = 1.0
OFFSET = 0.0

def watts(volts, amps):
    return round(volts * amps * SCALE + OFFSET, 2)
EOF
cat > test_meter.py <<'EOF'
import sys
from meter import watts

got = watts(12.0, 2.5)
if got != 30.0:
    print(f"FAIL: expected 30.0, got {got}")
    sys.exit(1)
print("OK")
EOF
git add .
commit_as "Ines Varga" "2026-11-18 08:00" "Add power meter and self-test"
git tag v0.1
for i in 1 2 3 4 5 6; do
    echo "# note $i" >> notes.txt
    git add notes.txt
    commit_as "Tomas Reid" "2026-11-18 08:0$i" "Log calibration reading $i"
done
sed -i 's/SCALE = 1.0/SCALE = 0.9/' meter.py
git add meter.py
commit_as "Pell Hansen" "2026-11-18 09:00" "Adjust thermal damping factor"
for i in 7 8 9 10 11; do
    echo "# note $i" >> notes.txt
    git add notes.txt
    commit_as "Mara Okafor" "2026-11-18 09:$(printf '%02d' $i)" "Log field check $i"
done
```

## Report

What's the hash of the first commit that broke `test_meter.py`?

```text
de6f91f
```

## Checks

```python
BAD = next(c["hash"] for c in commits("~/meter", "main") if c["message"] == "Adjust thermal damping factor")

expect(
    "You reported the exact first bad commit",
    answer().lower(),
    BAD[:7],
    "Use git bisect start HEAD v0.1 and test python3 test_meter.py to find the first bad commit.",
    accept=lambda value: len(value) >= 7 and BAD.startswith(value),
    reveal=False,
)
expect("Bisect mode is closed (back on main)", lambda: branch("~/meter"), "main", "Run git bisect reset when you finish bisecting.")
check("No bisect state remains in .git", lambda: not exists("~/meter/.git/BISECT_START"), "Run git bisect reset.")
```

## Hidden checks

```python
check("git bisect was used", lambda: len(git_calls("bisect")) >= 2)
```

## Solution

```bash
cd meter
git bisect start HEAD v0.1
git bisect run python3 test_meter.py
git bisect reset
```

## Restored

Four binary-search steps instead of twelve manual checks pinpointed the exact thermal damping commit that knocked the meter off calibration.
