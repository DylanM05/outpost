---
id: follow-the-failing-test
kind: terminal
title: Follow the failing test
system: Test bench
symbol: instrument
scene: files
skills: testing, debugging
---

## Briefing

Someone "tidied up" `Fleet.dispatch` on the relay last night. This morning the fleet sent Kite on a long delivery, and Kite came back on its last few minutes, while Hawk, with far more range, sat on the pad. The fleet tests in `~/workshop/test_fleet.py` would have caught it, if anyone had run them.

## Objective

Run the tests in `~/workshop`, find the bug they point to in `fleet.py`, and fix it, so every test passes. Fix the code, not the tests.

## Concept

When a test fails, read its failure from the top:

- The test's **name** says what behaviour broke: `test_dispatch_sends_the_longest_range`.
- The `assert` line and the values pytest shows under it say what was expected and what happened instead.
- Then go to the code that behaviour depends on, and compare what it does with what the test expects.

Fix the code so the test passes for the right reason. Changing a test to match broken code makes the failure go away, and leaves the bug where it was. Only change a test when the test itself is wrong.

Run every test after the fix, not just the one that failed, to check the fix didn't break something else.

## Hints

1. Run `pytest` in `~/workshop`. Two tests fail, and both are about `dispatch`.
2. One says `assert 'Kite' == 'Hawk'`: of the drones that could make the trip, the fleet chose the one with the shorter range.
3. In `fleet.py`, `dispatch` picks with `min(able)`. The longest range is `max(able)`.

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
cat > workshop/fleet.py <<'EOF'
# fleet.py: keeps the workshop's drones, and sends them out.


class Fleet:
    def __init__(self):
        self._drones = []

    def add(self, drone):
        if drone in self._drones:
            raise ValueError(f"{drone.name} is already in the fleet")
        self._drones.append(drone)

    def find(self, name):
        for drone in self._drones:
            if drone.name == name:
                return drone
        return None

    def __len__(self):
        return len(self._drones)

    def dispatch(self, distance):
        able = []
        for drone in self._drones:
            if drone.range_km() >= distance * 2:
                able.append(drone)
        if not able:
            return None
        best = min(able)
        best.deliver(distance)
        return best

    def report(self):
        plates = []
        for drone in sorted(self._drones, reverse=True):
            plates.append(str(drone))
        return plates
EOF
cat > workshop/test_fleet.py <<'EOF'
import pytest

from drones import CargoDrone, Drone
from fleet import Fleet


def make_fleet():
    fleet = Fleet()
    fleet.add(Drone("Kite"))
    fleet.add(Drone("Wren", 50, 30))
    fleet.add(Drone("Hawk", 50))
    return fleet


def test_dispatch_sends_the_longest_range():
    assert make_fleet().dispatch(20).name == "Hawk"


def test_dispatch_uses_battery():
    fleet = make_fleet()
    fleet.dispatch(20)
    assert fleet.find("Hawk").battery_left() == 42


def test_nothing_can_reach():
    assert make_fleet().dispatch(100) is None


def test_add_refuses_duplicates():
    fleet = make_fleet()
    with pytest.raises(ValueError):
        fleet.add(Drone("Kite", 40, 20))
EOF
```

## Checks

```python
ORIGINAL_TESTS = 'import pytest\n\nfrom drones import CargoDrone, Drone\nfrom fleet import Fleet\n\n\ndef make_fleet():\n    fleet = Fleet()\n    fleet.add(Drone("Kite"))\n    fleet.add(Drone("Wren", 50, 30))\n    fleet.add(Drone("Hawk", 50))\n    return fleet\n\n\ndef test_dispatch_sends_the_longest_range():\n    assert make_fleet().dispatch(20).name == "Hawk"\n\n\ndef test_dispatch_uses_battery():\n    fleet = make_fleet()\n    fleet.dispatch(20)\n    assert fleet.find("Hawk").battery_left() == 42\n\n\ndef test_nothing_can_reach():\n    assert make_fleet().dispatch(100) is None\n\n\ndef test_add_refuses_duplicates():\n    fleet = make_fleet()\n    with pytest.raises(ValueError):\n        fleet.add(Drone("Kite", 40, 20))\n'
expect(
    "Every test passes",
    lambda: [name for name, result in tests_in("~/workshop").items() if result != "passed"],
    [],
    "Read the failing tests' names and assert lines, then fix fleet.py.",
)
check("The tests are unchanged", lambda: read("~/workshop/test_fleet.py") == ORIGINAL_TESTS, "Fix fleet.py, not the tests. Start over to get the tests back.")
check("You ran the tests", lambda: ran("pytest") or any("pytest" in args for args in calls("python3")), "Run pytest.")
```

## Hidden checks

```python
expect(
    "A loaded cargo drone is chosen by its real range",
    lambda: tests_in(copy_of("~/workshop", {"test_hidden.py": 'from drones import CargoDrone, Drone\nfrom fleet import Fleet\n\n\ndef test_hidden_loaded_cargo():\n    fleet = Fleet()\n    mule = CargoDrone("Mule")\n    mule.load_up(2)\n    fleet.add(mule)\n    fleet.add(Drone("Wren", 50, 30))\n    sent = fleet.dispatch(15)\n    assert sent is not None and sent.name == "Mule", sent\n'})).get("test_hidden_loaded_cargo"),
    "passed",
    "dispatch should choose with max(), which compares drones by range_km().",
)
```

## Solution

```bash
cd workshop
pytest
sed -i 's/best = min(able)/best = max(able)/' fleet.py
pytest
```

## Restored

Hawk takes the long deliveries again. The tests caught it this time, and the workshop runs them every morning from now on.
