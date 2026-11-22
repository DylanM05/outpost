---
id: ws-room-broker
title: Build a multi-room WebSocket presence and broadcast broker
system: Frame rack
symbol: equipment
scene: tests
skills: websockets
---

## Briefing

Chat apps, live dashboards, and multiplayer lobbies route WebSocket messages into named **rooms**, exclude the sender on echo-free broadcasts, track heartbeat timestamps, and clean up every room membership cleanly when a client disconnects or times out.

## Concept

Implement `RoomBroker(heartbeat_timeout)`:
- `connect(client_id, now)` -> registers a connected client with `last_pong = now` and an empty inbox list.
- `join(client_id, room)` -> adds connected `client_id` to `room` (raise `KeyError` if not connected).
- `leave(client_id, room)` -> removes `client_id` from `room` (no-op if not in room).
- `broadcast(room, sender_id, message, include_sender=False)` -> appends `(room, sender_id, message)` to the inbox of every client currently in `room` (skipping `sender_id` unless `include_sender=True`), returning a **sorted** list of recipient `client_id`s.
- `pong(client_id, now)` -> updates `last_pong = now` for connected `client_id`.
- `reap_stale(now)` -> disconnects every client with `now - last_pong > heartbeat_timeout`, removing them from ALL rooms and returning a **sorted** list of reaped `client_id`s!
- `drain_inbox(client_id)` -> returns and clears that client's pending messages list.
- `room_members(room)` -> returns a **sorted** list of connected `client_id`s currently in `room`.

## Objective

Implement `RoomBroker(heartbeat_timeout)` with `connect`, `join`, `leave`, `broadcast`, `pong`, `reap_stale`, `drain_inbox`, and `room_members`.

## Hints

1. Keep both `self.rooms[room] = set()` and `self.client_rooms[client_id] = set()` so `reap_stale` removes a timed-out client from all their rooms in $O(\text{rooms joined})$ time!

## Starter: guided

```python
class RoomBroker:
    def __init__(self, heartbeat_timeout):
        self.heartbeat_timeout = heartbeat_timeout
        self.last_pong = {}
        self.inboxes = {}
        self.rooms = {}
        self.client_rooms = {}

    def connect(self, client_id, now):
        pass

    def join(self, client_id, room):
        pass

    def leave(self, client_id, room):
        pass

    def broadcast(self, room, sender_id, message, include_sender=False):
        pass

    def pong(self, client_id, now):
        pass

    def reap_stale(self, now):
        pass

    def drain_inbox(self, client_id):
        pass

    def room_members(self, room):
        return sorted(self.rooms.get(room, ()))
```

## Starter: standard

```python
class RoomBroker:
    def __init__(self, heartbeat_timeout):
        pass

    def connect(self, client_id, now):
        pass

    def join(self, client_id, room):
        pass

    def leave(self, client_id, room):
        pass

    def broadcast(self, room, sender_id, message, include_sender=False):
        pass

    def pong(self, client_id, now):
        pass

    def reap_stale(self, now):
        pass

    def drain_inbox(self, client_id):
        pass

    def room_members(self, room):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _broker():
    b = get("RoomBroker")(heartbeat_timeout=30)
    b.connect("ada", now=100)
    b.connect("lin", now=100)
    b.connect("sam", now=100)
    b.join("ada", "ops")
    b.join("lin", "ops")
    b.join("sam", "ops")
    recips = b.broadcast("ops", "ada", "deploying")
    b.pong("ada", now=125)
    b.pong("lin", now=125)
    # At t=135, sam has been silent for 35 > 30 -> reaped!
    reaped = b.reap_stale(now=135)
    return (recips, b.drain_inbox("lin"), b.drain_inbox("ada"), reaped, b.room_members("ops"))
expect("broadcasts excluding sender, delivers to inboxes, and reaps stale clients from rooms", _broker, (
    ["lin", "sam"],
    [("ops", "ada", "deploying")],
    [],
    ["sam"],
    ["ada", "lin"],
))
```

## Hidden checks

```python
def _include_and_leave():
    b = get("RoomBroker")(10)
    b.connect("u1", 0)
    b.join("u1", "chat")
    recips = b.broadcast("chat", "u1", "hi", include_sender=True)
    b.leave("u1", "chat")
    return (recips, b.room_members("chat"), b.reap_stale(10))  # 10 - 0 == 10 (not > 10)
expect("supports include_sender, leave, and exact heartbeat boundary", _include_and_leave, (["u1"], [], []))
```

## Solution

```python
class RoomBroker:
    def __init__(self, heartbeat_timeout):
        if heartbeat_timeout < 0:
            raise ValueError("heartbeat_timeout must be non-negative")
        self.heartbeat_timeout = heartbeat_timeout
        self.last_pong = {}
        self.inboxes = {}
        self.rooms = {}
        self.client_rooms = {}

    def connect(self, client_id, now):
        self.last_pong[client_id] = now
        self.inboxes.setdefault(client_id, [])
        self.client_rooms.setdefault(client_id, set())

    def join(self, client_id, room):
        if client_id not in self.last_pong:
            raise KeyError("client not connected")
        self.rooms.setdefault(room, set()).add(client_id)
        self.client_rooms[client_id].add(room)

    def leave(self, client_id, room):
        if room in self.rooms:
            self.rooms[room].discard(client_id)
            if not self.rooms[room]:
                del self.rooms[room]
        if client_id in self.client_rooms:
            self.client_rooms[client_id].discard(room)

    def broadcast(self, room, sender_id, message, include_sender=False):
        members = sorted(self.rooms.get(room, ()))
        recipients = []
        for cid in members:
            if not include_sender and cid == sender_id:
                continue
            self.inboxes[cid].append((room, sender_id, message))
            recipients.append(cid)
        return recipients

    def pong(self, client_id, now):
        if client_id not in self.last_pong:
            raise KeyError("client not connected")
        self.last_pong[client_id] = now

    def reap_stale(self, now):
        stale = sorted(cid for cid, ts in self.last_pong.items() if (now - ts) > self.heartbeat_timeout)
        for cid in stale:
            for room in list(self.client_rooms.pop(cid, ())):
                if room in self.rooms:
                    self.rooms[room].discard(cid)
                    if not self.rooms[room]:
                        del self.rooms[room]
            self.last_pong.pop(cid, None)
            self.inboxes.pop(cid, None)
        return stale

    def drain_inbox(self, client_id):
        msgs = list(self.inboxes.get(client_id, ()))
        if client_id in self.inboxes:
            self.inboxes[client_id] = []
        return msgs

    def room_members(self, room):
        return sorted(self.rooms.get(room, ()))
```

## Restored

The frame rack's WebSocket broker now manages room fan-out and heartbeat reaping cleanly.
