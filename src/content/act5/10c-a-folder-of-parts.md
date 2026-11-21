---
id: a-folder-of-parts
kind: terminal
title: A folder of parts
system: Parts bin
symbol: equipment
scene: files
skills: modules
---

## Briefing

Fleet control has grown to two modules, `drones.py` and `fleet.py`, and the valley has tidied them into a folder of their own, `~/workshop/fleetctl`, so they travel together. The morning dispatch plan, `~/workshop/plan.py`, hasn't caught up: it stops with `ModuleNotFoundError: No module named 'drones'`.

## Objective

Fix the imports in `~/workshop/plan.py`, so it imports from the modules where they are now. Don't move the modules back. Running it should print:

```text
Kite (40 km/h, 30 min)
```

## Concept

A folder of modules is a **package**. A package usually has a file named `__init__.py` in it, often empty, which marks the folder as one. Import a module inside a package with a dot between the folder's name and the module's:

```python
from fleetctl.drones import Drone
import fleetctl.fleet
```

Python finds `fleetctl` in the program's folder, then `drones.py` inside it. Packages let a project keep related modules together, and let two packages each have a module with the same name without mixing them up.

## Hints

1. Run `python3 plan.py` from `~/workshop` to see the error, and `ls fleetctl` to see where the modules are.
2. Change `from drones import` to `from fleetctl.drones import`.
3. Change `from fleet import` the same way, then run it again.

## Setup

```bash
mkdir -p workshop/fleetctl
: > workshop/fleetctl/__init__.py
cat > workshop/fleetctl/drones.py <<'EOF'
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
cat > workshop/fleetctl/fleet.py <<'EOF'
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
cat > workshop/plan.py <<'EOF'
from drones import CargoDrone, Drone
from fleet import Fleet

fleet = Fleet()
fleet.add(Drone("Kite"))
fleet.add(CargoDrone("Mule"))
print(fleet.dispatch(20))
EOF
```

## Checks

```python
expect("python3 plan.py", lambda: run("python3 plan.py", "~/workshop").out, "Kite (40 km/h, 30 min)\n", "Import from fleetctl.drones and fleetctl.fleet.")
check("plan.py imports from the fleetctl package", lambda: "fleetctl" in (read("~/workshop/plan.py") or ""))
check(
    "The modules are still in fleetctl",
    lambda: is_file("~/workshop/fleetctl/drones.py") and is_file("~/workshop/fleetctl/fleet.py") and not exists("~/workshop/drones.py") and not exists("~/workshop/fleet.py"),
    "Leave the modules in the package, and change the imports instead. Start over to put them back.",
)
```

## Solution

```bash
cd workshop
python3 plan.py
sed -i 's/^from drones import/from fleetctl.drones import/; s/^from fleet import/from fleetctl.fleet import/' plan.py
python3 plan.py
```

## Restored

The morning plan sends Kite again. Fleet control is a package now, and anything on the relay can use it with one import.
