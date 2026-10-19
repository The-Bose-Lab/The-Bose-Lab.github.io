#!/usr/bin/env python3
"""Create smaller lossless WebP animations only when decoded frames match GIFs.

Pillow's sequential GIF decoder applies disposal and compositing. Verification
compares every resulting RGBA pixel, frame duration, loop count, and canvas size;
the original files are never changed. Requires Pillow with animated WebP support.
"""

import argparse
import hashlib
import io
import json
from pathlib import Path
import struct

from PIL import Image, ImageChops


def digest(frame):
    return hashlib.sha256(frame.convert("RGBA").tobytes()).hexdigest()


def describe(path):
    with Image.open(path) as image:
        result = {"size": list(image.size), "loop": image.info.get("loop", 1), "frames": []}
        for index in range(image.n_frames):
            image.seek(index)
            image.load()
            result["frames"].append({
                "rgba_sha256": digest(image),
                "duration_ms": image.info.get("duration", 0),
            })
        return result


def uint24(value):
    return value.to_bytes(3, "little")


def chunk(kind, payload):
    return kind + struct.pack("<I", len(payload)) + payload + b"\0" * (len(payload) % 2)


def encode(source, target, expected):
    # Pillow's animation encoder does not forward exact=True. Instead encode
    # exact lossless frames, then mux replacement rectangles with NO_BLEND.
    # Comparing all four channels also preserves RGB under transparent pixels;
    # unchanged regions retain the preceding composited frame. No disposal or
    # lossy blending is used, and every original frame boundary is retained.
    width, height = expected["size"]
    with target.open("wb") as output, Image.open(source) as image:
        output.write(b"RIFF\0\0\0\0WEBP")
        output.write(chunk(b"VP8X", bytes([0x12]) + b"\0" * 3
                           + uint24(width - 1) + uint24(height - 1)))
        output.write(chunk(b"ANIM", b"\0" * 4 + struct.pack("<H", expected["loop"])))
        previous = None
        for index, metadata in enumerate(expected["frames"]):
            image.seek(index)
            frame = image.convert("RGBA")
            bounds = ((0, 0, width, height) if previous is None else
                      ImageChops.difference(frame, previous).getbbox(alpha_only=False))
            left, top, right, bottom = bounds or (0, 0, 1, 1)
            # WebP stores frame offsets in units of two pixels.
            left, top = left & ~1, top & ~1
            with frame.crop((left, top, right, bottom)) as rectangle, io.BytesIO() as buffer:
                rectangle.save(buffer, "WEBP", lossless=True, exact=True, quality=100, method=4)
                header = (uint24(left // 2) + uint24(top // 2)
                          + uint24(right - left - 1) + uint24(bottom - top - 1)
                          + uint24(metadata["duration_ms"]) + bytes([2]))
                output.write(chunk(b"ANMF", header + buffer.getvalue()[12:]))
            if previous is not None:
                previous.close()
            previous = frame
        if previous is not None:
            previous.close()
        size = output.tell()
        output.seek(4)
        output.write(struct.pack("<I", size - 8))


def optimize(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(target.stem + ".candidate.webp")
    record = {"source": str(source), "source_bytes": source.stat().st_size}
    try:
        expected = describe(source)
        encode(source, temporary, expected)
        actual = describe(temporary)
        record.update({"candidate_bytes": temporary.stat().st_size,
                       "frame_count": len(expected["frames"]),
                       "canvas": expected["size"], "loop": expected["loop"]})
        if expected != actual:
            record["status"] = "rejected: decoded frames, timing, loop, or size differ"
            if expected["size"] == actual["size"]:
                record["first_different_frame"] = next(
                    (index for index, pair in enumerate(zip(expected["frames"], actual["frames"]))
                     if pair[0] != pair[1]), None)
        elif temporary.stat().st_size >= source.stat().st_size:
            record["status"] = "rejected: no size reduction"
        else:
            temporary.replace(target)
            record.update({"status": "verified", "target": str(target),
                           "saved_bytes": record["source_bytes"] - record["candidate_bytes"],
                           "verification": "exact composited RGBA, durations, loop, dimensions"})
    except Exception as error:
        record["status"] = "rejected: " + str(error)
    finally:
        temporary.unlink(missing_ok=True)
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, default=Path(__file__).resolve().parents[1]
                        / "content/media-originals/normalizing-flow-maps")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1]
                        / "public/assets/blog/normalizing-flow-maps")
    parser.add_argument("--report", type=Path)
    arguments = parser.parse_args()
    records = []
    for source in sorted(arguments.directory.rglob("*.gif")):
        record = optimize(source, arguments.output / source.relative_to(arguments.directory).with_suffix(".webp"))
        records.append(record)
        print(json.dumps(record), flush=True)
    if arguments.report:
        arguments.report.parent.mkdir(parents=True, exist_ok=True)
        arguments.report.write_text(json.dumps(records, indent=2) + "\n")


if __name__ == "__main__":
    main()
