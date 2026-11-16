---
id: file-the-report
kind: terminal
title: File the fault report
system: Pipeline
symbol: controller
scene: files
skills: streams
---

## Briefing

The outpost wants the day's fault lines in a report file, not on somebody's screen. Whoever files the report signs the bottom of it.

## Objective

1. Save the lines of `~/logs/line.log` that contain `FAULT` into a new file, `~/reports/faults.txt`, using `grep` and `>`.
2. Add the line `reviewed by ranger` to the end of that file, using `echo` and `>>`.

## Concept

What a program prints goes to its **standard output**, or **stdout**. Normally that's the terminal, but the shell can send it into a file instead. That's called **redirecting** it:

```bash
grep heartbeat logs/line.log > reports/heartbeats.txt
```

prints nothing on screen. The lines go into the file.

- `>` creates the file, or **replaces everything in it** if it already exists.
- `>>` adds to the end of the file instead, creating it if it isn't there.

```bash
echo "first line" > notes.txt
echo "second line" >> notes.txt
```

The program never knows the difference. It prints as usual, and the shell decides where the output goes.

## Hints

1. Run the `grep` from the earlier mission, then add `> reports/faults.txt` to the end of it.
2. `cat reports/faults.txt` should show three fault lines.
3. Then `echo "reviewed by ranger" >> reports/faults.txt`. Use `>>`, because `>` would replace the faults.

## Setup

```bash
mkdir -p logs reports
python3 - <<'EOF'
lines = []
for i in range(600):
    relay = f"KR-RELAY-{1 + i % 6}"
    minute = 6 * 60 + i * 2
    stamp = f"{minute // 60 % 24:02d}:{minute % 60:02d}"
    if i in (151, 338, 517):
        lines.append(f"{stamp} KR-RELAY-4 FAULT antenna current out of range")
    else:
        lines.append(f"{stamp} {relay} heartbeat ok, no fault")
open("logs/line.log", "w").write("\n".join(lines) + "\n")
EOF
```

## Checks

```python
faults = "11:02 KR-RELAY-4 FAULT antenna current out of range\n17:16 KR-RELAY-4 FAULT antenna current out of range\n23:14 KR-RELAY-4 FAULT antenna current out of range\n"
report = read("~/reports/faults.txt") or ""
check("~/reports/faults.txt exists", is_file("~/reports/faults.txt"), "Redirect grep's output into it with >.")
check(
    "The report starts with the three fault lines",
    lambda: report.startswith(faults),
    "Use grep FAULT logs/line.log > reports/faults.txt. If you used >> first, start the file over with >.",
)
expect(
    "The report ends with the signature line",
    lambda: report[len(faults):] if report.startswith(faults) else report,
    "reviewed by ranger\n",
    "Append it once with echo and >>, after the fault lines.",
)
```

## Solution

```bash
grep FAULT logs/line.log > reports/faults.txt
echo "reviewed by ranger" >> reports/faults.txt
cat reports/faults.txt
```

## Restored

Three faults and a signature, filed. The report goes out with the evening call.
