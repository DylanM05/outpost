---
id: hls-playlist-gen
title: Generate adaptive HLS master and media playlists
system: Media rail
symbol: controller
scene: tests
skills: http-streaming
---

## Briefing

Instead of forcing mobile connections to download a 4K MP4, video CDNs slice streams into short chunks and serve **HLS (`.m3u8`)** manifests: a **media playlist** listing segment durations and URIs, and a **master playlist** advertising multiple bitrate variants so players switch quality automatically.

## Concept

1. **`build_media_playlist(segments, media_sequence=0, ended=True)`:**
   - `segments` is a non-empty list of `(duration_float, uri_str)` pairs (raise `ValueError` if empty or any duration `<= 0`).
   - `target_duration = math.ceil(max(d for d, _ in segments))`.
   - Output lines joined by `"\n"`:
     - `#EXTM3U`
     - `#EXT-X-VERSION:3`
     - `#EXT-X-TARGETDURATION:{target_duration}`
     - `#EXT-X-MEDIA-SEQUENCE:{media_sequence}`
     - For each `(dur, uri)`:
       - `#EXTINF:{dur:.3f},`
       - `{uri}`
     - If `ended` is `True`, append `#EXT-X-ENDLIST`.
2. **`build_master_playlist(variants)`:**
   - `variants` is a list of dicts `{"bandwidth": int, "resolution": "1280x720", "uri": "720p/index.m3u8"}`, sorted **ascending** by `bandwidth`.
   - Output lines joined by `"\n"`:
     - `#EXTM3U`
     - For each sorted variant:
       - `#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={resolution}`
       - `{uri}`

## Objective

Implement `build_media_playlist(segments, media_sequence=0, ended=True)` and `build_master_playlist(variants)`.

## Hints

1. Use `math.ceil(max(d for d, _ in segments))` for `#EXT-X-TARGETDURATION` (HLS requires target duration to be an integer `>=` every segment's rounded duration).
2. Format durations with `f"#EXTINF:{dur:.3f},"` (note the trailing comma!).

## Starter: guided

```python
import math


def build_media_playlist(segments, media_sequence=0, ended=True):
    if not segments or any(d <= 0 for d, _ in segments):
        raise ValueError("segments must be non-empty with positive durations")
    target = math.ceil(max(d for d, _ in segments))
    lines = [
        "#EXTM3U",
        "#EXT-X-VERSION:3",
        f"#EXT-X-TARGETDURATION:{target}",
        f"#EXT-X-MEDIA-SEQUENCE:{media_sequence}",
    ]
    # Append #EXTINF + uri for each segment, and #EXT-X-ENDLIST when ended=True.
    pass


def build_master_playlist(variants):
    pass
```

## Starter: standard

```python
import math


def build_media_playlist(segments, media_sequence=0, ended=True):
    pass


def build_master_playlist(variants):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("builds VOD media playlist with ceiling target duration", lambda: get("build_media_playlist")([(4.0, "seg0.ts"), (5.2, "seg1.ts")]), "\n".join([
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-TARGETDURATION:6",
    "#EXT-X-MEDIA-SEQUENCE:0",
    "#EXTINF:4.000,",
    "seg0.ts",
    "#EXTINF:5.200,",
    "seg1.ts",
    "#EXT-X-ENDLIST",
]))

expect("sorts master playlist variants ascending by bandwidth", lambda: get("build_master_playlist")([
    {"bandwidth": 2800000, "resolution": "1280x720", "uri": "720p.m3u8"},
    {"bandwidth": 800000, "resolution": "640x360", "uri": "360p.m3u8"},
]), "\n".join([
    "#EXTM3U",
    "#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360",
    "360p.m3u8",
    "#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720",
    "720p.m3u8",
]))
```

## Hidden checks

```python
expect("live playlist omits #EXT-X-ENDLIST and sets media sequence", lambda: get("build_media_playlist")([(2.5, "s10.ts")], media_sequence=10, ended=False), "\n".join([
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-TARGETDURATION:3",
    "#EXT-X-MEDIA-SEQUENCE:10",
    "#EXTINF:2.500,",
    "s10.ts",
]))

def _empty():
    try:
        get("build_media_playlist")([])
        return False
    except ValueError:
        return True
expect("empty segments raises ValueError", _empty, True)
```

## Solution

```python
import math


def build_media_playlist(segments, media_sequence=0, ended=True):
    if not segments or any(d <= 0 for d, _ in segments):
        raise ValueError("segments must be non-empty with positive durations")
    target = math.ceil(max(d for d, _ in segments))
    lines = [
        "#EXTM3U",
        "#EXT-X-VERSION:3",
        f"#EXT-X-TARGETDURATION:{target}",
        f"#EXT-X-MEDIA-SEQUENCE:{media_sequence}",
    ]
    for dur, uri in segments:
        lines.append(f"#EXTINF:{dur:.3f},")
        lines.append(uri)
    if ended:
        lines.append("#EXT-X-ENDLIST")
    return "\n".join(lines)


def build_master_playlist(variants):
    lines = ["#EXTM3U"]
    for v in sorted(variants, key=lambda item: item["bandwidth"]):
        lines.append(f"#EXT-X-STREAM-INF:BANDWIDTH={v['bandwidth']},RESOLUTION={v['resolution']}")
        lines.append(v["uri"])
    return "\n".join(lines)
```

## Restored

The media rail now publishes standards-compliant adaptive HLS master and media playlists.
