---
id: biggest-climb
title: Biggest climb
system: Survey desk
symbol: controller
scene: work
skills: complexity
---

## Briefing

A survey team walked the ridge trail and recorded the elevation every hundred meters. The route planners want the biggest climb on the trail: the largest gain from any point to any point further along. Downhill stretches don't count, however long they are.

## Objective

Write `biggest_climb(elevations)`. Return the largest value of `elevations[j] - elevations[i]`, where `j` comes after `i`. If the trail never climbs, or has fewer than two points, return `0`.

```python
biggest_climb([40, 10, 30, 20, 60])  # 50, from 10 up to 60
biggest_climb([50, 40, 30])          # 0
```

The hidden test uses 1,000 elevations and allows 3,000 reads.

## Concept

The obvious way is to try every pair with a nested loop, as you did to balance the lift. It's correct, but quadratic: 1,000 points means about half a million pairs.

A better way reads each elevation once. Walk along the trail and keep track of two things:

- the **lowest** point so far
- the **biggest climb** so far

At each new point, the best climb that ends here is `this point - lowest so far`. If it beats the biggest climb, keep it. Then, if this point is lower than the lowest so far, it becomes the new lowest.

`max(a, b)` returns the larger of two values, and `min(a, b)` the smaller.

Carrying a small summary of what you've seen, instead of looking back over all of it, turns many quadratic problems into linear ones.

## Hints

1. Handle short trails first. Then start with `lowest = elevations[0]` and `best = 0`.
2. For each elevation: `best = max(best, elevation - lowest)`, then `lowest = min(lowest, elevation)`.
3. Loop over the list once, with `for elevation in elevations:`. Don't index back into earlier points.

## Starter: guided

```python
def biggest_climb(elevations):
    if len(elevations) < 2:
        return 0
    lowest = elevations[0]
    best = 0
    for elevation in elevations:
        # The climb that ends here is elevation - lowest. Keep it if it's
        # the biggest so far, then update lowest if this point is lower.
        print(elevation, lowest)
    return best


print(biggest_climb([40, 10, 30, 20, 60]))
```

## Starter: standard

```python
def biggest_climb(elevations):
    best = 0
    for i in range(len(elevations)):
        for j in range(i + 1, len(elevations)):
            best = max(best, elevations[j] - elevations[i])
    return best
```

## Starter: challenge

```python
```

## Checks

```python
expect("biggest_climb([40, 10, 30, 20, 60])", lambda: get("biggest_climb")([40, 10, 30, 20, 60]), 50)
expect("biggest_climb([50, 40, 30])", lambda: get("biggest_climb")([50, 40, 30]), 0)
trail = tracked([12, 18, 9, 15, 30, 21])
expect_within(
    "biggest_climb(6 elevations)",
    lambda: get("biggest_climb")(trail),
    21,
    trail,
    18,
    "Keep the lowest point so far instead of comparing every pair.",
)
```

## Hidden checks

```python
expect("biggest_climb([])", lambda: get("biggest_climb")([]), 0)
expect("biggest_climb([7])", lambda: get("biggest_climb")([7]), 0)
expect("biggest_climb([5, 5, 5])", lambda: get("biggest_climb")([5, 5, 5]), 0)
expect("biggest_climb([-20, -35, -5])", lambda: get("biggest_climb")([-20, -35, -5]), 30)
plain = [((i * 37) % 101) - ((i * 13) % 59) for i in range(1000)]
expected = 0
lowest = plain[0]
for point in plain:
    expected = max(expected, point - lowest)
    lowest = min(lowest, point)
long_trail = tracked(plain)
expect_within(
    "biggest_climb(1,000 elevations)",
    lambda: get("biggest_climb")(long_trail),
    expected,
    long_trail,
    3000,
    "Keep the lowest point so far instead of comparing every pair.",
)
```

## Solution

```python
def biggest_climb(elevations):
    if len(elevations) < 2:
        return 0
    lowest = elevations[0]
    best = 0
    for elevation in elevations:
        best = max(best, elevation - lowest)
        lowest = min(lowest, elevation)
    return best
```

## Restored

The planners mark the steepest stretch on the trail map, and the survey desk answers in a moment however long the trail gets.
