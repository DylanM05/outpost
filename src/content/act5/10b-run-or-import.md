---
id: run-or-import
kind: terminal
title: Run or import
system: Parts bin
symbol: equipment
scene: files
skills: modules
---

## Briefing

The last engineer left a test flight at the bottom of `drones.py`, to check the classes work when the file is run. Now the name plate printer prints an extra plate from it every morning, a Kite with 60 minutes that isn't in the hangar at all. The test flight should run when someone runs `drones.py`, and never when another program imports it.

## Objective

Change `~/workshop/drones.py` so its test flight only runs when the file is run as a program:

- `python3 drones.py` still prints `Kite (40 km/h, 60 min)`.
- `python3 plates.py` prints only the two plates.

## Concept

Importing a module runs the whole file, top to bottom. Definitions like `class` and `def` just create things, but any other code at the top level runs too, so a module's test flight runs for every program that imports it.

Python sets a variable called `__name__` in every module. When a file is run as a program, its `__name__` is `"__main__"`. When it's imported, `__name__` is the module's name, `"drones"`. So this `if` runs its block only when the file is the program being run:

```python
if __name__ == "__main__":
    kite = Drone("Kite")
    kite.fly(30)
    print(kite)
```

Most Python files that can be run end with a block like this. Everything above it can be imported, and the block is what happens when you run the file itself.

## Hints

1. Run `python3 plates.py` to see the stray plate, then open `drones.py` in `nano`.
2. Add `if __name__ == "__main__":` above the test flight, and indent its three lines by four spaces.
3. Check both: `python3 drones.py` and `python3 plates.py`.

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

# A quick test flight, to check the classes work.
kite = Drone("Kite")
kite.fly(30)
print(kite)
EOF
cat > workshop/plates.py <<'EOF'
from drones import Drone

print(Drone("Kite"))
print(Drone("Wren", 50, 30))
EOF
```

## Checks

```python
expect("python3 plates.py prints only the plates", lambda: run("python3 plates.py", "~/workshop").out, "Kite (40 km/h, 90 min)\nWren (50 km/h, 30 min)\n", "Put the test flight under if __name__ == \"__main__\":.")
expect("python3 drones.py still runs the test flight", lambda: run("python3 drones.py", "~/workshop").out, "Kite (40 km/h, 60 min)\n", "Keep the test flight, inside the if block.")
```

## Hidden checks

```python
expect("Importing drones prints nothing", lambda: run("python3 -c 'import drones'", "~/workshop").out, "")
```

## Solution

```bash
cd workshop
python3 plates.py
# Players add the if line and indent the test flight in nano; sed does the same.
sed -i 's/^kite = Drone("Kite")$/if __name__ == "__main__":\n    kite = Drone("Kite")/; s/^kite.fly(30)$/    kite.fly(30)/; s/^print(kite)$/    print(kite)/' drones.py
python3 drones.py
python3 plates.py
```

## Restored

The hangar door prints two plates, and the engineer's test flight still runs whenever someone runs `drones.py` to check it.
