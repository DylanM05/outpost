---
id: wal-crash-trace
kind: predict
title: Crash recovery from a write-ahead log
system: Journal desk
symbol: instrument
scene: console
skills: storage-engines, reading-code
---

## Briefing

Power just cut out in the middle of two database transactions. Fortunately, before touching any table in memory, the database appended every operation to its **Write-Ahead Log (WAL)**. During recovery, only transactions with a `COMMIT` record are applied — half-written transactions vanish cleanly!

## Objective

Trace the WAL replay below and predict **every line it prints**.

## Concept

**Atomicity** ("all or nothing") comes straight from the WAL:
- Transaction `1` logged `BEGIN`, `PUT a=10`, `PUT b=20`, and `COMMIT` -> **replayed!**
- Transaction `2` logged `BEGIN`, `PUT a=999`, and then power failed before `COMMIT` -> **discarded!**
- Transaction `3` logged `BEGIN`, `PUT c=5`, `ABORT` -> **discarded!**

## Hints

1. Look for which transaction IDs appear in a `("COMMIT", tx)` record.
2. Only `tx=1` committed (`a=10`, `b=20`); `tx=2` had no `COMMIT`, and `tx=3` aborted!
3. Print `sorted(committed)` and `sorted(db.items())`.

## Program

```python
wal = [
    ("BEGIN", 1),
    ("PUT", 1, "a", 10),
    ("BEGIN", 2),
    ("PUT", 2, "a", 999),
    ("PUT", 1, "b", 20),
    ("COMMIT", 1),
    ("BEGIN", 3),
    ("PUT", 3, "c", 5),
    ("ABORT", 3),
]

committed = {rec[1] for rec in wal if rec[0] == "COMMIT"}
db = {}
for rec in wal:
    if rec[0] == "PUT" and rec[1] in committed:
        db[rec[2]] = rec[3]

print(sorted(committed))
print(sorted(db.items()))
```

## Output

```text
[1]
[('a', 10), ('b', 20)]
```

## Restored

Even after a mid-write power cut, WAL replay brings back committed transactions intact and erases partial writes cleanly.
