---
id: maintenance-flatten-the-manifest
title: Flatten the manifest
system: Cave survey
symbol: controller
scene: calls
skills: recursion
reviewSkill: recursion
prerequisite: count-the-crystals
---

## Briefing

The cave team packed supplies in crates inside crates, and the manifest follows the same nesting. The depot wants a plain list.

## Objective

Write `flatten(manifest)`, using recursion. `manifest` is a list whose items are labels (strings) or more lists of the same kind. Return one flat list of every label, in the order they appear.

```python
flatten([["fuel", ["seed"]], "tools"])  # ["fuel", "seed", "tools"]
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Build a result list as you go through the manifest's items.
2. A label goes straight into the result. A list gets flattened by calling `flatten` on it.
3. `result += flatten(item)` adds every label from the inner list to the end of the result.

## Starter

```python
```

## Checks

```python
expect_recursive('flatten([["fuel", ["seed"]], "tools"])', "flatten", ([["fuel", ["seed"]], "tools"],), ["fuel", "seed", "tools"])
expect_recursive('flatten(["ice", "rope"])', "flatten", (["ice", "rope"],), ["ice", "rope"], recurse=False)
```

## Hidden checks

```python
expect_recursive("flatten([])", "flatten", ([],), [], recurse=False)
expect_recursive("flatten([[], [[]]])", "flatten", ([[], [[]]],), [])
expect_recursive('flatten([[[["deep"]]], "shallow"])', "flatten", ([[[["deep"]]], "shallow"],), ["deep", "shallow"])
expect_recursive('flatten(["a", ["b", ["c", "d"]], "e"])', "flatten", (["a", ["b", ["c", "d"]], "e"],), ["a", "b", "c", "d", "e"])
```

## Solution

```python
def flatten(manifest):
    result = []
    for item in manifest:
        if isinstance(item, list):
            result += flatten(item)
        else:
            result.append(item)
    return result
```

## Restored

The depot gets one clean list, and every nested crate is accounted for.
