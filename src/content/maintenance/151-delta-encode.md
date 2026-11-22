---
id: maintenance-delta-encode
title: Delta-encode and decode timestamp columns
system: Column vault
symbol: equipment
scene: tests
skills: analytical-storage
reviewSkill: analytical-storage
prerequisite: reservoir-sample
---

## Briefing

Unix timestamps like `[1700000000, 1700000005, 1700000010]` waste bytes repeating the same leading digits. **Delta encoding** stores the first value raw and every following value as the difference from its predecessor!

## Objective

Implement two functions:
1. `delta_encode(nums)` — returns `[]` for empty input; otherwise `[nums[0], nums[1] - nums[0], nums[2] - nums[1], ...]`.
2. `delta_decode(deltas)` — reconstructs the original list via prefix sums (`[]` for empty input).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. In `delta_encode`, start with `[nums[0]]` and append `nums[i] - nums[i - 1]` for `i` from `1` to `len(nums) - 1`.
2. In `delta_decode`, keep a running `acc` starting at `deltas[0]` and add each delta in turn.

## Starter

```python
```

## Checks

```python
expect("encodes timestamps into small deltas", lambda: get("delta_encode")([1700000000, 1700000005, 1700000012, 1700000012]), [1700000000, 5, 7, 0])
expect("decodes deltas back losslessly including negative steps", lambda: get("delta_decode")(get("delta_encode")([100, 105, 98, 120])), [100, 105, 98, 120])
```

## Hidden checks

```python
expect("handles empty and single-element lists", lambda: (get("delta_encode")([]), get("delta_decode")([]), get("delta_encode")([42]), get("delta_decode")([42])), ([], [], [42], [42]))
```

## Solution

```python
def delta_encode(nums):
    if not nums:
        return []
    out = [nums[0]]
    for i in range(1, len(nums)):
        out.append(nums[i] - nums[i - 1])
    return out


def delta_decode(deltas):
    if not deltas:
        return []
    acc = deltas[0]
    out = [acc]
    for d in deltas[1:]:
        acc += d
        out.append(acc)
    return out
```

## Restored

Monotonic timestamp columns now store tiny delta offsets that compress tightly on disk.
