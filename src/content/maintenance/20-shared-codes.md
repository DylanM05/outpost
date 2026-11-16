---
id: maintenance-shared-codes
title: Match the two ledgers
system: Index vault
symbol: instrument
scene: work
skills: hashing
reviewSkill: hashing
prerequisite: fill-the-lift
---

## Briefing

The vault and the depot each keep a ledger of marker codes. The auditors want the codes that appear in both, in the vault's order.

## Objective

Write `shared(vault, depot)`. Neither list has repeats. Return a list of the codes in `vault` that also appear in `depot`, in the order they appear in `vault`. Read the depot ledger only once or twice: the hidden test matches two ledgers of 1,500 codes, with a budget of 3,000 reads of the depot's list.

```python
shared([40, 12, 7, 99], [7, 3, 40])  # [40, 7]
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Checking `code in depot` searches the whole depot list every time.
2. Put the depot's codes in a set once, then check each vault code against the set.
3. Loop over `vault` to keep its order, appending each code the set contains.

## Starter

```python
```

## Checks

```python
expect("shared([40, 12, 7, 99], [7, 3, 40])", lambda: get("shared")([40, 12, 7, 99], [7, 3, 40]), [40, 7])
expect("shared([1, 2], [3, 4])", lambda: get("shared")([1, 2], [3, 4]), [])
```

## Hidden checks

```python
expect("shared([], [1])", lambda: get("shared")([], [1]), [])
expect("shared([5, 6], [])", lambda: get("shared")([5, 6], []), [])
expect("shared([3, 2, 1], [1, 2, 3])", lambda: get("shared")([3, 2, 1], [1, 2, 3]), [3, 2, 1], "Keep the vault's order.")
vault_codes = [(i * 7919) % 100000 for i in range(1500)]
depot_codes = [(i * 7919) % 100000 for i in range(750, 2250)]
in_depot = set(depot_codes)
depot = tracked(depot_codes)
expect_within(
    "shared(1,500 codes, 1,500 codes)",
    lambda: get("shared")(vault_codes, depot),
    [code for code in vault_codes if code in in_depot],
    depot,
    3000,
    "Put the depot's codes in a set instead of searching its list for every code.",
)
```

## Solution

```python
def shared(vault, depot):
    in_depot = set(depot)
    matches = []
    for code in vault:
        if code in in_depot:
            matches.append(code)
    return matches
```

## Restored

The auditors get their list in the vault's order, and the two ledgers finally agree on what's where.
