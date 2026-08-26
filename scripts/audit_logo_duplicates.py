#!/usr/bin/env python3
"""Fail when a normalized logo collection contains exact or perceptual duplicates."""
from __future__ import annotations
import argparse, hashlib, json, sys
from pathlib import Path
from PIL import Image
import numpy as np

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", type=Path)
    parser.add_argument("--threshold", type=float, default=1.5)
    args = parser.parse_args()
    files = sorted(args.directory.glob("*.webp"))
    exact = {}
    images = []
    for path in files:
        exact.setdefault(hashlib.sha256(path.read_bytes()).hexdigest(), []).append(path.name)
        with Image.open(path) as image:
            images.append(np.asarray(image.convert("RGB").resize((32, 32)), dtype=np.int16))
    exact_groups = [group for group in exact.values() if len(group) > 1]
    perceptual = []
    for index, left in enumerate(files):
        for other, right in enumerate(files[index + 1:], index + 1):
            distance = float(np.abs(images[index] - images[other]).mean())
            if distance < args.threshold:
                perceptual.append({"distance": round(distance, 3), "files": [left.name, right.name]})
    result = {"files": len(files), "exact_duplicate_groups": exact_groups, "perceptual_duplicates": perceptual, "threshold": args.threshold}
    print(json.dumps(result, indent=2))
    return 1 if exact_groups or perceptual else 0

if __name__ == "__main__":
    raise SystemExit(main())
