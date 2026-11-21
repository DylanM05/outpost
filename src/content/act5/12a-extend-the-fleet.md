---
id: extend-the-fleet
kind: terminal
title: Extend the fleet
system: Rescue wing
symbol: controller
scene: files
skills: classes, inheritance, polymorphism, modules, testing
assessment: true
---

## Briefing

The valley is sending up two rescue drones for the winter: fast, and kept on the pad for emergencies. Fleet control, in `~/fleet-control`, doesn't know they exist, and as it stands it would happily send one out with a crate of spares while a climber waits on the ridge. Teach fleet control about rescue drones, and prove it with a test.

This is an independent mission. There's no step-by-step lesson, and hints unlock after your second submission. Use what you've learned in the workshop, and Python's documentation if you need it.

## Objective

In `~/fleet-control`:

1. Add a class `RescueDrone` to `fleetctl/drones.py`. A rescue drone is a drone that flies at 60 km/h unless told otherwise, and its name plate ends with ` [rescue]`:

   ```text
   Lark (60 km/h, 90 min) [rescue]
   ```

2. Make `Fleet.dispatch` never send a rescue drone, whatever its range.
3. Add `Fleet.rescue(distance)`, which works like `dispatch` but only ever sends rescue drones: the one with the longest range that can make the round trip. It returns the drone it sent, or `None`.
4. In a new file, `test_rescue.py`, write a test named `test_dispatch_skips_rescue_drones`. Set up a fleet where a rescue drone has the longest range, and check that `dispatch` sends something else.

Every test in `~/fleet-control` must pass, including the ones already there.

## Concept

This mission brings the workshop together:

| You need to | Reach for |
|---|---|
| Make a new kind of drone | a child class, and `super().__init__` |
| Change its name plate | override `__str__`, building on `super().__str__()` |
| Treat rescue drones differently in the fleet | a method every drone has that `RescueDrone` overrides, or `isinstance(drone, RescueDrone)`, which says whether an object is a `RescueDrone` |
| Use a class from another module | `from fleetctl.drones import RescueDrone` |
| Write a test | a `test_` function with `assert`, in a `test_` file |
| Run the tests | `pytest`, from `~/fleet-control` |

## Hints

1. `class RescueDrone(Drone):` with a constructor that passes `name`, `speed` (60 by default), and `battery` to `super().__init__`, and `__str__` returning `super().__str__() + " [rescue]"`.
2. In `dispatch`, skip a drone when `isinstance(drone, RescueDrone)`, after importing `RescueDrone` at the top of `fleet.py`. `rescue` is a copy of `dispatch` that keeps only rescue drones.
3. In `test_rescue.py`, add `Drone("Kite")` and `RescueDrone("Lark")` to a fleet, and `assert fleet.dispatch(20).name == "Kite"`. Then run `pytest`.

## Setup

```bash
mkdir -p fleet-control/fleetctl
: > fleet-control/fleetctl/__init__.py
cat > fleet-control/fleetctl/drones.py <<'EOF'
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
cat > fleet-control/fleetctl/fleet.py <<'EOF'
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
        best = max(able)
        best.deliver(distance)
        return best

    def report(self):
        plates = []
        for drone in sorted(self._drones, reverse=True):
            plates.append(str(drone))
        return plates
EOF
cat > fleet-control/test_drones.py <<'EOF'
import pytest

from fleetctl.drones import CargoDrone, Drone


def test_new_drone_is_full():
    assert Drone("Kite").battery_left() == 90


def test_charge_stops_at_full():
    kite = Drone("Kite")
    kite.fly(10)
    kite.charge(30)
    assert kite.battery_left() == 90


def test_fly_uses_battery():
    kite = Drone("Kite")
    kite.fly(30)
    assert kite.battery_left() == 60


def test_fly_refuses_too_long():
    mule = Drone("Mule", 30, 45)
    with pytest.raises(ValueError):
        mule.fly(80)
    assert mule.battery_left() == 45


def test_load_cuts_range():
    mule = CargoDrone("Mule")
    mule.load_up(2)
    assert mule.range_km() == 36


def test_plate():
    assert str(Drone("Wren", 50, 30)) == "Wren (50 km/h, 30 min)"
EOF
cat > fleet-control/test_fleet.py <<'EOF'
import pytest

from fleetctl.drones import Drone
from fleetctl.fleet import Fleet


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


def test_report():
    assert make_fleet().report() == ["Hawk (50 km/h, 90 min)", "Kite (40 km/h, 90 min)", "Wren (50 km/h, 30 min)"]
EOF
```

## Checks

```python
PROJECT = "~/fleet-control"
CHECKS = 'from fleetctl.drones import CargoDrone, Drone, RescueDrone\nfrom fleetctl.fleet import Fleet\n\n\ndef test_outpost_kind():\n    assert issubclass(RescueDrone, Drone), "RescueDrone isn\'t a child of Drone."\n    assert RescueDrone("Lark").speed == 60, f"Its speed is {RescueDrone(\'Lark\').speed}."\n    assert RescueDrone("Lark", 70).speed == 70, "A speed that\'s given isn\'t used."\n\n\ndef test_outpost_plate():\n    plate = str(RescueDrone("Lark"))\n    assert plate == "Lark (60 km/h, 90 min) [rescue]", f"Its plate is {plate!r}."\n\n\ndef test_outpost_dispatch():\n    fleet = Fleet()\n    fleet.add(Drone("Kite"))\n    lark = RescueDrone("Lark")\n    fleet.add(lark)\n    sent = fleet.dispatch(20)\n    assert sent is not None and sent.name == "Kite", f"dispatch(20) sent {sent}."\n    assert lark.battery_left() == 90, "The rescue drone\'s battery changed."\n    alone = Fleet()\n    alone.add(RescueDrone("Swift"))\n    assert alone.dispatch(5) is None, "With only a rescue drone, dispatch sent it."\n\n\ndef test_outpost_rescue():\n    fleet = Fleet()\n    fleet.add(Drone("Kite"))\n    fleet.add(RescueDrone("Swift", 60, 30))\n    fleet.add(RescueDrone("Lark"))\n    sent = fleet.rescue(20)\n    assert sent is not None and sent.name == "Lark", f"rescue(20) sent {sent}."\n    assert str(sent) == "Lark (60 km/h, 50 min) [rescue]", f"After the trip, Lark is {sent}."\n    assert fleet.rescue(30) is None, "rescue(30) sent a drone that couldn\'t make the round trip."\n    assert fleet.find("Kite").battery_left() == 90, "rescue sent or flew an ordinary drone."\n\n\ndef test_outpost_rescue_empty():\n    fleet = Fleet()\n    fleet.add(Drone("Kite"))\n    assert fleet.rescue(5) is None, "With no rescue drones, rescue sent something."\n'


FOUND = {}


def result(name):
    # Runs the checks' own tests on a copy of the project, once per check run.
    if not FOUND:
        FOUND.update(tests_in(copy_of(PROJECT, {"test_outpost_checks.py": CHECKS})))
    outcome = FOUND.get("test_outpost_checks.py") or FOUND.get(name) or FOUND.get("_error") or "missing"
    outcome = re.sub(r"/tmp/outpost-copy-\d+/", "", outcome)
    return outcome.removeprefix("failed: ").removeprefix("AssertionError: ")


def verdict(label, name, hint=""):
    expect(label, lambda: result(name), "passing", hint, accept=lambda outcome: outcome == "passed")


verdict("RescueDrone is a kind of Drone, at 60 km/h by default", "test_outpost_kind", "Add it to fleetctl/drones.py.")
verdict("A rescue drone's name plate ends with [rescue]", "test_outpost_plate")
verdict("dispatch never sends a rescue drone", "test_outpost_dispatch")
verdict("rescue sends the rescue drone with the longest range", "test_outpost_rescue")
check(
    "test_dispatch_skips_rescue_drones passes",
    lambda: tests_in(PROJECT).get("test_dispatch_skips_rescue_drones") == "passed",
    "Write it in test_rescue.py, in ~/fleet-control, and run pytest.",
)
expect(
    "Every test in ~/fleet-control passes",
    lambda: [name for name, outcome in tests_in(PROJECT).items() if outcome != "passed"],
    [],
)
```

## Hidden checks

```python
ORIGINAL = {"test_drones.py": 'import pytest\n\nfrom fleetctl.drones import CargoDrone, Drone\n\n\ndef test_new_drone_is_full():\n    assert Drone("Kite").battery_left() == 90\n\n\ndef test_charge_stops_at_full():\n    kite = Drone("Kite")\n    kite.fly(10)\n    kite.charge(30)\n    assert kite.battery_left() == 90\n\n\ndef test_fly_uses_battery():\n    kite = Drone("Kite")\n    kite.fly(30)\n    assert kite.battery_left() == 60\n\n\ndef test_fly_refuses_too_long():\n    mule = Drone("Mule", 30, 45)\n    with pytest.raises(ValueError):\n        mule.fly(80)\n    assert mule.battery_left() == 45\n\n\ndef test_load_cuts_range():\n    mule = CargoDrone("Mule")\n    mule.load_up(2)\n    assert mule.range_km() == 36\n\n\ndef test_plate():\n    assert str(Drone("Wren", 50, 30)) == "Wren (50 km/h, 30 min)"\n', "test_fleet.py": 'import pytest\n\nfrom fleetctl.drones import Drone\nfrom fleetctl.fleet import Fleet\n\n\ndef make_fleet():\n    fleet = Fleet()\n    fleet.add(Drone("Kite"))\n    fleet.add(Drone("Wren", 50, 30))\n    fleet.add(Drone("Hawk", 50))\n    return fleet\n\n\ndef test_dispatch_sends_the_longest_range():\n    assert make_fleet().dispatch(20).name == "Hawk"\n\n\ndef test_dispatch_uses_battery():\n    fleet = make_fleet()\n    fleet.dispatch(20)\n    assert fleet.find("Hawk").battery_left() == 42\n\n\ndef test_nothing_can_reach():\n    assert make_fleet().dispatch(100) is None\n\n\ndef test_add_refuses_duplicates():\n    fleet = make_fleet()\n    with pytest.raises(ValueError):\n        fleet.add(Drone("Kite", 40, 20))\n\n\ndef test_report():\n    assert make_fleet().report() == ["Hawk (50 km/h, 90 min)", "Kite (40 km/h, 90 min)", "Wren (50 km/h, 30 min)"]\n'}
ORIGINAL_FLEET = '# fleet.py: keeps the workshop\'s drones, and sends them out.\n\n\nclass Fleet:\n    def __init__(self):\n        self._drones = []\n\n    def add(self, drone):\n        if drone in self._drones:\n            raise ValueError(f"{drone.name} is already in the fleet")\n        self._drones.append(drone)\n\n    def find(self, name):\n        for drone in self._drones:\n            if drone.name == name:\n                return drone\n        return None\n\n    def __len__(self):\n        return len(self._drones)\n\n    def dispatch(self, distance):\n        able = []\n        for drone in self._drones:\n            if drone.range_km() >= distance * 2:\n                able.append(drone)\n        if not able:\n            return None\n        best = max(able)\n        best.deliver(distance)\n        return best\n\n    def report(self):\n        plates = []\n        for drone in sorted(self._drones, reverse=True):\n            plates.append(str(drone))\n        return plates\n'

verdict("rescue sends nothing when there are no rescue drones", "test_outpost_rescue_empty")
expect(
    "The original tests pass on your code",
    lambda: [name for name, outcome in tests_in(copy_of(PROJECT, ORIGINAL)).items() if outcome != "passed"],
    [],
    "Keep the existing tests passing, and don't change what they check.",
)
expect(
    "Your test catches a dispatch that sends rescue drones",
    lambda: tests_in(copy_of(PROJECT, {"fleetctl/fleet.py": ORIGINAL_FLEET})).get("test_dispatch_skips_rescue_drones", "missing"),
    "a failing test",
    "In your test, give the rescue drone the longest range, so a dispatch that didn't skip it would send it.",
    accept=lambda outcome: outcome.startswith("failed"),
)
```

## Solution

```bash
cd fleet-control
cat >> fleetctl/drones.py <<'EOF'


class RescueDrone(Drone):
    def __init__(self, name, speed=60, battery=Drone.MAX_BATTERY):
        super().__init__(name, speed, battery)

    def __str__(self):
        return super().__str__() + " [rescue]"
EOF
sed -i 's/^class Fleet:/from fleetctl.drones import RescueDrone\n\n\nclass Fleet:/' fleetctl/fleet.py
sed -i 's/            if drone.range_km() >= distance \* 2:/            if drone.range_km() >= distance * 2 and not isinstance(drone, RescueDrone):/' fleetctl/fleet.py
cat >> fleetctl/fleet.py <<'EOF'

    def rescue(self, distance):
        able = []
        for drone in self._drones:
            if isinstance(drone, RescueDrone) and drone.range_km() >= distance * 2:
                able.append(drone)
        if not able:
            return None
        best = max(able)
        best.deliver(distance)
        return best
EOF
cat > test_rescue.py <<'EOF'
from fleetctl.drones import Drone, RescueDrone
from fleetctl.fleet import Fleet


def test_dispatch_skips_rescue_drones():
    fleet = Fleet()
    fleet.add(Drone("Kite"))
    fleet.add(RescueDrone("Lark"))
    assert fleet.dispatch(20).name == "Kite"
EOF
pytest
```

## Restored

Lark and Swift wait on the pad, and the fleet sends every ordinary delivery past them. When the call comes from the ridge, `rescue` sends the one that can get furthest, and a test makes sure nobody ever changes that by accident. The workshop's fleet control is finished, tested, and ready for whatever the valley sends next.
