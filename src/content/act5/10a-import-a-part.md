---
id: import-a-part
kind: terminal
title: Import a part
system: Parts bin
symbol: equipment
scene: files
skills: modules
---

## Briefing

Fleet control works, but it lives in the editor, and the valley wants it on the relay machine, where it can run every morning on its own. The workshop has copied the drone classes onto the relay, into `~/workshop/drones.py`. The name plate printer for the hangar door needs them, and pasting all the classes into it would give the workshop two copies to keep in step.

## Objective

In `~/workshop`, write a program `plates.py` that imports `Drone` from the `drones` module, and prints the name plates of two drones: Kite, made with the defaults, and Wren, at 50 km/h with 30 minutes of battery. Run it.

```text
Kite (40 km/h, 90 min)
Wren (50 km/h, 30 min)
```

## Concept

Every Python file is a **module**, and a program can use what another module defines by **importing** it. The module's name is the file's name without `.py`:

```python
import drones

kite = drones.Drone("Kite")
```

`import drones` runs `drones.py` and gives you its names through `drones.`. To use a name on its own, import it directly:

```python
from drones import Drone

kite = Drone("Kite")
```

Python looks for modules in the folder of the program you run, and then in its own library, so `plates.py` and `drones.py` need to be in the same folder.

This is how real programs are built: split into files by job, each file importing what it needs from the others, and nothing written twice. The first import also makes a `__pycache__` folder, where Python keeps a compiled copy of the module to load faster next time. You can ignore it, and leave it out of Git.

## Hints

1. `cd workshop`, then `nano plates.py`.
2. The first line is `from drones import Drone`. Then print `Drone("Kite")`, and `Drone("Wren", 50, 30)`.
3. Run it with `python3 plates.py`, from inside `~/workshop`.

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
```

## Checks

```python
plates = lambda: read("~/workshop/plates.py") or ""
check("~/workshop/plates.py exists", lambda: is_file("~/workshop/plates.py"), "Write the program in ~/workshop, next to drones.py.")
expect("python3 plates.py prints the two plates", lambda: run("python3 plates.py", "~/workshop").out, "Kite (40 km/h, 90 min)\nWren (50 km/h, 30 min)\n")
check(
    "plates.py imports Drone, rather than copying it",
    lambda: re.search(r"^\s*(from drones import|import drones)", plates(), re.M) and "class Drone" not in plates(),
    "Use from drones import Drone, and don't paste the class in.",
)
check("You ran it", lambda: any("plates.py" in args for args in calls("python3")), "Run python3 plates.py.")
```

## Solution

```bash
cd workshop
cat > plates.py <<'EOF'
from drones import Drone

print(Drone("Kite"))
print(Drone("Wren", 50, 30))
EOF
python3 plates.py
```

## Restored

The hangar door prints Kite's and Wren's plates, from the same classes fleet control uses. Fix a class once, and both programs get the fix.
