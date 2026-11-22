---
id: autoscale-policy
title: Scale replica pools with asymmetric cooldown hysteresis
system: Scale deck
symbol: controller
scene: tests
skills: cloud-runtime
---

## Briefing

Without cooldown windows, a noisy CPU spike causes an autoscaler to thrash — launching instances, killing them ten seconds later, and launching them again. Cloud autoscalers scale **out** rapidly (short cooldown) and scale **in** cautiously (long cooldown) within `[min_replicas, max_replicas]`.

## Concept

Implement `AutoScaler(min_replicas, max_replicas, target_util, scale_out_cd, scale_in_cd)`:
- Starts at `self.replicas = min_replicas` and `self.last_scale_at = None`.
- **`evaluate(current_util, now)`:**
  - Desired replicas: `desired = math.ceil(self.replicas * (current_util / target_util))` clamped into `[min_replicas, max_replicas]` (if `current_util <= 0`, `desired = min_replicas`).
  - If `desired == self.replicas`: return `(self.replicas, "HOLD")`.
  - If `desired > self.replicas` (scale out):
    - Allowed iff `last_scale_at is None` or `now - last_scale_at >= scale_out_cd`.
    - If allowed: `self.replicas = desired`, `self.last_scale_at = now`, return `(self.replicas, "SCALE_OUT")`.
    - Else: return `(self.replicas, "COOLDOWN")`.
  - If `desired < self.replicas` (scale in):
    - Allowed iff `last_scale_at is None` or `now - last_scale_at >= scale_in_cd`.
    - If allowed: `self.replicas = desired`, `self.last_scale_at = now`, return `(self.replicas, "SCALE_IN")`.
    - Else: return `(self.replicas, "COOLDOWN")`.

## Objective

Implement `AutoScaler` with `evaluate(current_util, now)` (raising `ValueError` if `min_replicas < 1`, `max_replicas < min_replicas`, or `target_util <= 0`).

## Hints

1. Use `math.ceil(self.replicas * (current_util / self.target_util))` clamped with `max(self.min_replicas, min(self.max_replicas, raw))`.
2. Only update `self.last_scale_at = now` when a scale action actually occurs (`SCALE_OUT` or `SCALE_IN`), never on `"HOLD"` or `"COOLDOWN"`.

## Starter: guided

```python
import math


class AutoScaler:
    def __init__(self, min_replicas, max_replicas, target_util, scale_out_cd, scale_in_cd):
        if min_replicas < 1 or max_replicas < min_replicas or target_util <= 0:
            raise ValueError("invalid autoscaler config")
        self.min_replicas = min_replicas
        self.max_replicas = max_replicas
        self.target_util = target_util
        self.scale_out_cd = scale_out_cd
        self.scale_in_cd = scale_in_cd
        self.replicas = min_replicas
        self.last_scale_at = None

    def evaluate(self, current_util, now):
        pass
```

## Starter: standard

```python
import math


class AutoScaler:
    def __init__(self, min_replicas, max_replicas, target_util, scale_out_cd, scale_in_cd):
        pass

    def evaluate(self, current_util, now):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _scale():
    a = get("AutoScaler")(min_replicas=2, max_replicas=10, target_util=50.0, scale_out_cd=30, scale_in_cd=120)
    r1 = a.evaluate(100.0, now=100)  # 2 * (100/50) = 4 -> SCALE_OUT
    r2 = a.evaluate(10.0, now=160)   # 60s < 120s scale-in cooldown -> COOLDOWN!
    r3 = a.evaluate(75.0, now=160)   # 4 * (75/50) = 6; 60s >= 30s scale-out cd -> SCALE_OUT!
    r4 = a.evaluate(10.0, now=300)   # 140s >= 120s -> ceil(6 * 0.2) = 2 -> SCALE_IN!
    r5 = a.evaluate(50.0, now=310)   # 2 * 1.0 = 2 -> HOLD
    return [r1, r2, r3, r4, r5]
expect("scales out rapidly, holds scale-in during cooldown, and clamps bounds", _scale, [
    (4, "SCALE_OUT"),
    (4, "COOLDOWN"),
    (6, "SCALE_OUT"),
    (2, "SCALE_IN"),
    (2, "HOLD"),
])
```

## Hidden checks

```python
def _clamp_max():
    a = get("AutoScaler")(1, 4, 50.0, 10, 60)
    return (a.evaluate(500.0, now=0), a.evaluate(0.0, now=100))
expect("clamps at max_replicas and drops cleanly to min_replicas on zero load", _clamp_max, ((4, "SCALE_OUT"), (1, "SCALE_IN")))
```

## Solution

```python
import math


class AutoScaler:
    def __init__(self, min_replicas, max_replicas, target_util, scale_out_cd, scale_in_cd):
        if min_replicas < 1 or max_replicas < min_replicas or target_util <= 0:
            raise ValueError("invalid autoscaler config")
        self.min_replicas = min_replicas
        self.max_replicas = max_replicas
        self.target_util = target_util
        self.scale_out_cd = scale_out_cd
        self.scale_in_cd = scale_in_cd
        self.replicas = min_replicas
        self.last_scale_at = None

    def evaluate(self, current_util, now):
        if current_util <= 0:
            desired = self.min_replicas
        else:
            raw = math.ceil(self.replicas * (current_util / self.target_util))
            desired = max(self.min_replicas, min(self.max_replicas, raw))
        if desired == self.replicas:
            return (self.replicas, "HOLD")
        if desired > self.replicas:
            if self.last_scale_at is not None and (now - self.last_scale_at) < self.scale_out_cd:
                return (self.replicas, "COOLDOWN")
            self.replicas = desired
            self.last_scale_at = now
            return (self.replicas, "SCALE_OUT")
        if self.last_scale_at is not None and (now - self.last_scale_at) < self.scale_in_cd:
            return (self.replicas, "COOLDOWN")
        self.replicas = desired
        self.last_scale_at = now
        return (self.replicas, "SCALE_IN")
```

## Restored

The scale deck now adjusts capacity smoothly without flapping during transient load spikes.
