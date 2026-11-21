---
id: write-a-test
kind: terminal
title: Write a test
system: Test bench
symbol: instrument
scene: files
skills: testing
---

## Briefing

The charging bug is fixed. Looking at the valley's tests again, nothing checks that flying uses battery, and that's the thing the planners rely on most. If anyone ever broke `fly`, every test would still pass.

## Objective

Add a test named `test_fly_uses_battery` to `~/workshop/test_drones.py`. It flies a new drone for 30 minutes, and checks that it has 60 minutes of battery left. Run the tests: they should all pass.

## Concept

A test usually has three steps: set something up, do the thing being tested, and check the result.

```python
def test_charge_stops_at_full():
    kite = Drone("Kite")          # set up
    kite.fly(10)                  # do it
    kite.charge(30)
    assert kite.battery_left() == 90   # check
```

Give each test a name that says what it checks, so a failure tells you what broke before you read any further. Each test should check one behaviour, and stand on its own, making its own drones rather than sharing them with other tests.

A test is only worth having if it would fail when the code is wrong. A good habit: once your test passes, break the code on purpose for a moment, check that the test fails, and put the code back.

## Hints

1. Open `test_drones.py` in `nano`, and add the new function at the end, with two blank lines before it.
2. Make a drone, call `fly(30)` on it, then `assert` that `battery_left()` is `60`.
3. Run `pytest`. It should print five dots.

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
```

## Checks

```python
check(
    "test_fly_uses_battery passes",
    lambda: tests_in("~/workshop").get("test_fly_uses_battery") == "passed",
    "Add a function named test_fly_uses_battery to test_drones.py, and run pytest to check it.",
)
expect(
    "Every test passes",
    lambda: [name for name, result in tests_in("~/workshop").items() if result != "passed"],
    [],
)
expect(
    "It fails when fly doesn't use the battery",
    lambda: tests_in(mutant("~/workshop", "drones.py", "self._battery = self._battery - minutes", "self._battery = self._battery")).get("test_fly_uses_battery", "missing"),
    "a failing test",
    "Fly the drone, then assert on battery_left().",
    accept=lambda outcome: outcome.startswith("failed"),
)
check("You ran the tests", lambda: ran("pytest") or any("pytest" in args for args in calls("python3")), "Run pytest.")
```

## Solution

```bash
cd workshop
cat >> test_drones.py <<'EOF'


def test_fly_uses_battery():
    kite = Drone("Kite")
    kite.fly(30)
    assert kite.battery_left() == 60
EOF
pytest
```

## Restored

Five tests now, and the most important one is yours. If `fly` ever stops using battery, the workshop will know before a drone does.
