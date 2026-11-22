---
id: cosine-similarity
title: Cosine similarity and vector norms
system: Vector vault
symbol: equipment
scene: tests
skills: vector-rag
---

## Briefing

Keyword search misses synonyms like *"battery"* and *"power cell"*. Embedding models map text into dense numeric vectors where similar meanings point in the same direction. Measuring **cosine similarity** tells you how closely two vectors align regardless of magnitude.

## Concept

For two vectors $a, b \in \mathbb{R}^d$:
$$\text{cosine}(a, b) = \frac{\sum_i a_i b_i}{\|a\|_2 \cdot \|b\|_2}$$
where $\|a\|_2 = \sqrt{\sum_i a_i^2}$ is the L2 norm.
- Identical direction -> `1.0`
- Orthogonal (unrelated) -> `0.0`
- Opposite direction -> `-1.0`

Always guard against:
- Empty vectors or mismatched dimensions (`len(a) != len(b)` -> `ValueError`).
- Zero-magnitude vectors (`norm == 0.0` -> return `0.0` for `cosine_similarity`, and a list of zeros for `normalize_vector`, avoiding `ZeroDivisionError`!).

## Objective

Implement two functions:
1. `normalize_vector(vec)` — raises `ValueError` if `vec` is empty; otherwise returns a list of floats scaled to unit L2 length (or all `0.0`s if the L2 norm is `0.0`).
2. `cosine_similarity(a, b)` — raises `ValueError` if either vector is empty or `len(a) != len(b)`; otherwise returns the float cosine similarity (`0.0` if either vector has zero norm).

## Hints

1. Use `math.sqrt(sum(x * x for x in vec))` for the L2 norm.
2. In `cosine_similarity`, compute `dot = sum(x * y for x, y in zip(a, b))` and divide by `norm_a * norm_b` when both norms are `> 0`.

## Starter: guided

```python
import math


def normalize_vector(vec):
    if not vec:
        raise ValueError("vector must not be empty")
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0.0:
        return [0.0 for _ in vec]
    # Return each element divided by norm
    return []


def cosine_similarity(a, b):
    if not a or len(a) != len(b):
        raise ValueError("vectors must be non-empty and same length")
    # Compute dot product and norms
    return 0.0
```

## Starter: standard

```python
import math


def normalize_vector(vec):
    pass


def cosine_similarity(a, b):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("unit vector normalizes 3-4 triangle", lambda: [round(x, 4) for x in get("normalize_vector")([3, 4])], [0.6, 0.8])
expect("identical directions score 1.0", lambda: round(get("cosine_similarity")([1, 2, 3], [2, 4, 6]), 6), 1.0)
expect("orthogonal vectors score 0.0", lambda: round(get("cosine_similarity")([1, 0], [0, 5]), 6), 0.0)
expect("opposite vectors score -1.0", lambda: round(get("cosine_similarity")([1, -1], [-2, 2]), 6), -1.0)
```

## Hidden checks

```python
expect("zero vector similarity returns 0.0 safely", lambda: get("cosine_similarity")([0, 0], [1, 2]), 0.0)
expect("normalize zero vector returns zeros", lambda: get("normalize_vector")([0, 0, 0]), [0.0, 0.0, 0.0])
def _mismatch():
    try:
        get("cosine_similarity")([1, 2], [1, 2, 3])
        return False
    except ValueError:
        return True
expect("dimension mismatch raises ValueError", _mismatch, True)
```

## Solution

```python
import math


def normalize_vector(vec):
    if not vec:
        raise ValueError("vector must not be empty")
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0.0:
        return [0.0 for _ in vec]
    return [x / norm for x in vec]


def cosine_similarity(a, b):
    if not a or len(a) != len(b):
        raise ValueError("vectors must be non-empty and the same length")
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    return dot / (norm_a * norm_b)
```

## Restored

Dense embeddings can now be L2-normalized and compared by direction without divide-by-zero crashes.
