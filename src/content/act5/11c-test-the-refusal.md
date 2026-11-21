---
id: test-the-refusal
kind: terminal
title: Test the refusal
system: Test bench
symbol: instrument
scene: files
skills: testing, errors
---

## Briefing

The rule that kept Mule out of the snowfield, "refuse a flight the battery can't cover", isn't tested either. That's the rule the workshop can least afford to lose.

## Objective

Add a test named `test_fly_refuses_too_long` to `~/workshop/test_drones.py`. It checks two things about a drone with 45 minutes of battery that's told to fly 80:

1. `fly` raises a `ValueError`.
2. Afterwards, the drone still has 45 minutes.

Run the tests: they should all pass.

## Concept

When the behaviour you're testing is an exception, the test has to expect it: an exception that nobody catches makes a test fail. `pytest.raises` catches it for you:

```python
import pytest


def test_take_refuses_too_much():
    crate = Crate("spares", 12)
    with pytest.raises(ValueError):
        crate.take(20)
```

`with` starts a block, like `if` or `for`. This one passes if the code inside it raises a `ValueError`, and fails the test if it doesn't. Code after the block runs as usual, so you can go on to check that the object was left as it was.

`pytest` has to be imported at the top of the file to use `pytest.raises`.

## Hints

1. Add `import pytest` as the first line of `test_drones.py`.
2. Make `Drone("Mule", 30, 45)`, then call `mule.fly(80)` inside `with pytest.raises(ValueError):`.
3. After the block, not inside it, `assert mule.battery_left() == 45`.

## Setup

```bash
mkdir workshop
cat > workshop/drones.py <<'EOF'
# drones.py: the workshop's drone classes.


class Drone:
    MAX_BATTERY = 90

    def __init__(self, name, speed=40, battery=MAX_BATTERY):
        self.name = name
        self.speed = speed
        self._battery = battery

    def battery_left(self):
        return self._battery

    def charge(self, minutes):
        self._battery = min(self._battery + minutes, Drone.MAX_BATTERY)

    def fly(self, minutes):
        if minutes > self._battery:
            raise ValueError("not enough battery")
        self._battery = self._battery - minutes

    def range_km(self):
        return self._battery * self.speed / 60

    def deliver(self, distance):
        # A round trip, using the battery in proportion to the range it needs.
        # round() gives the nearest whole number of minutes.
        if self.range_km() == 0 or distance * 2 > self.range_km():
            return False
        self.fly(round(self._battery * distance * 2 / self.range_km()))
        return True

    def __str__(self):
        return f"{self.name} ({self.speed} km/h, {self._battery} min)"

    def __eq__(self, other):
        return self.name == other.name

    def __lt__(self, other):
        return self.range_km() < other.range_km()


class CargoDrone(Drone):
    def __init__(self, name, speed=30, max_load=5):
        super().__init__(name, speed)
        self.max_load = max_load
        self.load = 0

    def can_lift(self, kg):
        return kg <= self.max_load

    def load_up(self, kg):
        if not self.can_lift(kg):
            raise ValueError("too heavy")
        self.load = kg

    def range_km(self):
        return super().range_km() * (1 - self.load / 10)


class SurveyDrone(Drone):
    def __init__(self, name, speed=40):
        super().__init__(name, speed)
        self.photos = []

    def photograph(self, area):
        self.fly(2)
        self.photos.append(area)
EOF
cat > workshop/test_drones.py <<'EOF'
from drones import CargoDrone, Drone


def test_new_drone_is_full():
    assert Drone("Kite").battery_left() == 90


def test_range():
    assert Drone("Kite").range_km() == 60


def test_charge_stops_at_full():
    kite = Drone("Kite")
    kite.fly(10)
    kite.charge(30)
    assert kite.battery_left() == 90


def test_load_cuts_range():
    mule = CargoDrone("Mule")
    mule.load_up(2)
    assert mule.range_km() == 36
EOF
cat >> workshop/test_drones.py <<'EOF'


def test_fly_uses_battery():
    kite = Drone("Kite")
    kite.fly(30)
    assert kite.battery_left() == 60
EOF
```

## Checks

```python
check(
    "test_fly_refuses_too_long passes",
    lambda: tests_in("~/workshop").get("test_fly_refuses_too_long") == "passed",
    "Add a function named test_fly_refuses_too_long, and import pytest at the top of the file.",
)
expect("Every test passes", lambda: [name for name, result in tests_in("~/workshop").items() if result != "passed"], [])
expect(
    "It fails when fly doesn't refuse",
    lambda: tests_in(mutant("~/workshop", "drones.py", 'raise ValueError("not enough battery")', "pass")).get("test_fly_refuses_too_long", "missing"),
    "a failing test",
    "Call fly inside with pytest.raises(ValueError):.",
    accept=lambda outcome: outcome.startswith("failed"),
)
```

## Hidden checks

```python
expect(
    "It fails when fly drains the battery before refusing",
    lambda: tests_in(mutant("~/workshop", "drones.py", 'raise ValueError("not enough battery")', 'self._battery = 0\n            raise ValueError("not enough battery")')).get("test_fly_refuses_too_long", "missing"),
    "a failing test",
    "After the with block, check that the battery is still 45.",
    accept=lambda outcome: outcome.startswith("failed"),
)
```

## Solution

```bash
cd workshop
sed -i '1i import pytest\n' test_drones.py
cat >> test_drones.py <<'EOF'


def test_fly_refuses_too_long():
    mule = Drone("Mule", 30, 45)
    with pytest.raises(ValueError):
        mule.fly(80)
    assert mule.battery_left() == 45
EOF
pytest
```

## Restored

The snowfield rule has a test now. Anyone who changes `fly` and breaks it will see `test_fly_refuses_too_long` fail before the change goes anywhere.
