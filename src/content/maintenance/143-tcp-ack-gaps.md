---
id: maintenance-tcp-ack-gaps
title: Find missing byte gaps in a TCP receive buffer
system: Stream window
symbol: controller
scene: tests
skills: transport-protocols
reviewSkill: transport-protocols
prerequisite: tcp-aimd-cwnd
---

## Briefing

Selective Acknowledgments (TCP SACK) work by identifying exact missing byte ranges between `expected_seq` and out-of-order bytes sitting in the receive buffer.

## Objective

Write `missing_ranges(expected_seq, buffered_seqs)` where `expected_seq` is an integer and `buffered_seqs` is an iterable of buffered sequence numbers (integers, possibly unsorted or containing old sequences `< expected_seq`).

Return a sorted list of half-open `(start, end)` tuples representing every contiguous missing range strictly below `max(buffered_seqs)` starting from `expected_seq`. If no buffered sequence is `> expected_seq`, return `[]`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Filter to `future = sorted({s for s in buffered_seqs if s >= expected_seq})`. If empty, return `[]`.
2. Track `cursor = expected_seq`: for each `s` in `future`, if `s > cursor`, append `(cursor, s)`; then set `cursor = s + 1`.

## Starter

```python
```

## Checks

```python
expect("finds two missing gaps across buffered out-of-order bytes", lambda: get("missing_ranges")(10, [12, 13, 16, 17]), [(10, 12), (14, 16)])
expect("returns empty when buffered bytes are contiguous from expected_seq", lambda: get("missing_ranges")(10, [10, 11, 12]), [])
```

## Hidden checks

```python
expect("ignores old sequences below expected_seq", lambda: get("missing_ranges")(20, [5, 19, 22]), [(20, 22)])
expect("empty buffer returns empty list", lambda: get("missing_ranges")(0, []), [])
```

## Solution

```python
def missing_ranges(expected_seq, buffered_seqs):
    future = sorted({s for s in buffered_seqs if s >= expected_seq})
    if not future:
        return []
    gaps = []
    cursor = expected_seq
    for seq in future:
        if seq > cursor:
            gaps.append((cursor, seq))
        cursor = seq + 1
    return gaps
```

## Restored

Missing TCP sequence gaps are pinpointed cleanly for selective retransmission.
