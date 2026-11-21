---
id: run-the-tests
kind: terminal
title: Run the tests
system: Test bench
symbol: instrument
scene: files
skills: testing
---

## Briefing

The valley sent fleet control up the line with something the workshop has never had: tests, in `~/workshop/test_drones.py`. They're small programs that check the drone classes do what they should, and they can be run whenever anything changes. The valley says one of them has been failing since the relay copy was made.

## Objective

Run the tests in `~/workshop` with pytest, and report the name of the test that fails.

## Concept

A **test** is code that checks other code. With **pytest**, Python's most widely used testing tool, a test is a function whose name starts with `test_`, in a file whose name starts with `test_`:

```python
from drones import Drone


def test_new_drone_is_full():
    assert Drone("Kite").battery_left() == 90
```

`assert` checks that something is true. If it is, nothing happens. If it isn't, the test fails, and pytest shows the values involved, so you can see what went wrong.

Run every test in the folder with:

```bash
pytest
```

pytest finds the test files, runs each test function, and prints a `.` for each test that passes and an `F` for each one that fails. Then it shows each failure in detail, and a summary. It takes a few seconds to start on the relay.

Tests are how you know code still works after you change it: run them after every change, and a mistake shows up straight away, not on a cold morning in the field.

## Hints

1. `cd workshop`, then run `pytest`.
2. Look for the `F` in the first line, then the section called `FAILURES`.
3. The failing test's name is in the heading of its section, and in the summary at the end, after `FAILED test_drones.py::`.

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
        self._battery = self._battery + minutes

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

## Report

Which test fails?

```text
test_charge_stops_at_full
```

## Checks

```python
check(
    "You ran the tests with pytest",
    lambda: ran("pytest") or any("pytest" in args for args in calls("python3")),
    "Run pytest inside ~/workshop.",
)
expect(
    "You reported the failing test",
    (answer().split("::")[-1].split() or [""])[0].removesuffix("()"),
    "test_charge_stops_at_full",
    "Read the name after FAILED in pytest's summary.",
    reveal=False,
)
```

## Solution

```bash
cd workshop
pytest
```

## Restored

`test_charge_stops_at_full`: the relay copy of `charge` lets a battery go past 90. Nobody would have noticed until a range report came out wrong. The test noticed first.
