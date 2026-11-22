---
id: maintenance-hls-duration
title: Sum total media duration from an HLS playlist
system: Media rail
symbol: controller
scene: tests
skills: http-streaming
reviewSkill: http-streaming
prerequisite: mime-sniffing
---

## Briefing

Video players calculate total playback length by parsing every `#EXTINF:<duration>,` directive inside an HLS `.m3u8` media playlist.

## Objective

Write `playlist_duration(m3u8_text)` returning the sum of all `#EXTINF:` durations rounded to 3 decimal places (`round(total, 3)`). Lines may have optional text after the comma (e.g. `#EXTINF:4.500,title`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. For each stripped line starting with `"#EXTINF:"`, slice after `":"`, split on `","`, and add `float(parts[0])`.

## Starter

```python
```

## Checks

```python
_PLAYLIST = "#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXTINF:4.250,\na.ts\n#EXTINF:5.750,chapter2\nb.ts\n#EXT-X-ENDLIST"
expect("sums all EXTINF durations", lambda: get("playlist_duration")(_PLAYLIST), 10.0)
```

## Hidden checks

```python
expect("empty or master playlist has 0.0 duration", lambda: get("playlist_duration")("#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000\nlow.m3u8"), 0.0)
expect("rounds floating totals to 3 decimals", lambda: get("playlist_duration")("#EXTINF:1.1,\na.ts\n#EXTINF:2.2,\nb.ts"), 3.3)
```

## Solution

```python
def playlist_duration(m3u8_text):
    total = 0.0
    for line in m3u8_text.splitlines():
        s = line.strip()
        if s.startswith("#EXTINF:"):
            raw = s[len("#EXTINF:"):].split(",", 1)[0].strip()
            total += float(raw)
    return round(total, 3)
```

## Restored

Media players now compute accurate stream durations directly from HLS manifests.
