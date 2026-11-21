---
id: context-window-trace
kind: predict
title: Trim chat history to a context budget
system: Token bench
symbol: instrument
scene: console
skills: tokenization-context, reading-code
---

## Briefing

Every language model has a hard context window limit. When a conversation grows too long, the station assistant keeps the **system prompt pinned** and preserves the **most recent contiguous turns** that fit within the token budget, stopping as soon as adding the next older turn would overflow.

## Objective

Trace the context-window trimmer below and predict **every line it prints**.

## Concept

Why `break` instead of `continue` when walking backward through turns?
If you skipped an older long turn just to squeeze in an even older tiny turn, the model would see a broken conversation with missing replies in the middle! Stopping at the first overflow keeps a clean, contiguous recent suffix.

## Hints

1. `system` takes `4` tokens up front.
2. Walking `turns` in reverse: `u3` (+3 -> 7), `a2` (+5 -> 12), `u2` (+4 -> 16), then `a1` (+6 -> 22 > 16) triggers `break`.
3. `kept` is reversed back into chronological order and prepended with `system[0]`.

## Program

```python
system = ("system", 4)
turns = [
    ("u1", 5),
    ("a1", 6),
    ("u2", 4),
    ("a2", 5),
    ("u3", 3),
]
budget = 16

used = system[1]
kept = []
for label, cost in reversed(turns):
    if used + cost > budget:
        break
    kept.append(label)
    used += cost

kept.reverse()
print([system[0]] + kept)
print(used)
```

## Output

```text
['system', 'u2', 'a2', 'u3']
16
```

## Restored

The token bench pins system instructions and trims oldest turns without scrambling conversation chronology.
