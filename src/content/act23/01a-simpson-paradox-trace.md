---
id: simpson-paradox-trace
kind: predict
title: Trace Simpson's paradox in grouped vs. pooled conversion rates
system: Census bench
symbol: instrument
scene: console
skills: applied-statistics, reading-code
---

## Briefing

Averaging conversion rates across unbalanced segments can completely reverse the truth: Variant **A** can beat Variant **B** on *both* mobile and desktop individually, yet lose when the rows are pooled together! This classic data-analysis trap is **Simpson's paradox**.

## Objective

Trace the conversion comparison below and predict **every line it prints**.

## Concept

When Variant A gets most of its traffic from a lower-converting segment (mobile) and Variant B gets most of its traffic from a higher-converting segment (desktop), pooling totals hides the confounding segment variable:
- Mobile: A = `40/200 = 20.0%`, B = `15/100 = 15.0%` (A wins!).
- Desktop: A = `90/100 = 90.0%`, B = `160/200 = 80.0%` (A wins!).
- Pooled: A = `130/300 = 43.3%`, B = `175/300 = 58.3%` (B appears to win!).

## Hints

1. Check each segment's winner (`A` vs `B`), then sum successes and trials across both segments for the pooled rate!

## Program

```python
data = {
    "mobile":  {"A": (40, 200),  "B": (15, 100)},
    "desktop": {"A": (90, 100),  "B": (160, 200)},
}

def pct(wins, n):
    return round(100 * wins / n, 1)

for seg, groups in data.items():
    ra = pct(*groups["A"])
    rb = pct(*groups["B"])
    winner = "A" if ra > rb else "B"
    print(f"{seg}: A={ra}% B={rb}% winner={winner}")

tot_a = (sum(g["A"][0] for g in data.values()), sum(g["A"][1] for g in data.values()))
tot_b = (sum(g["B"][0] for g in data.values()), sum(g["B"][1] for g in data.values()))
pa, pb = pct(*tot_a), pct(*tot_b)
print(f"pooled: A={pa}% B={pb}% winner={'A' if pa > pb else 'B'}")
```

## Output

```text
mobile: A=20.0% B=15.0% winner=A
desktop: A=90.0% B=80.0% winner=A
pooled: A=43.3% B=58.3% winner=B
```

## Restored

You caught Simpson's paradox in action — always stratify experiments by confounding segments before declaring a winner.
