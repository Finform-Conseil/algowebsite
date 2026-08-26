#!/usr/bin/env python3
"""Convert BRVM PNG logos to visually lossless WebP files.

The source PNG files are never deleted. By default, WebP files are written
next to their PNG source files under public/logos-brvm.
"""

from __future__ import annotations

import argparse
import os
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

from PIL import Image


DEFAULT_SOURCE_DIR = Path("public/logos-brvm")


@dataclass(frozen=True)
class ConversionResult:
    source: Path
    output: Path
    status: str
    output_bytes: int = 0


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert BRVM PNG logos to pixel-verified lossless WebP."
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=DEFAULT_SOURCE_DIR,
        help="Directory containing PNG logos (default: public/logos-brvm).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Destination directory (default: the source directory).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-encode existing WebP files instead of skipping them.",
    )
    return parser.parse_args(argv)


def iter_png_files(source_dir: Path) -> Iterable[Path]:
    if not source_dir.is_dir():
        raise ValueError(f"Source directory does not exist: {source_dir}")

    files = sorted(
        path
        for path in source_dir.iterdir()
        if path.is_file() and path.suffix.lower() == ".png"
    )
    if not files:
        raise ValueError(f"No PNG logos found in: {source_dir}")
    return files


def _metadata_for_webp(image: Image.Image) -> dict[str, bytes]:
    metadata: dict[str, bytes] = {}
    for key in ("icc_profile", "exif", "xmp"):
        value = image.info.get(key)
        if isinstance(value, bytes):
            metadata[key] = value
    return metadata


def _assert_pixel_identity(source: Image.Image, encoded: Image.Image) -> None:
    if source.size != encoded.size:
        raise RuntimeError(
            f"Resolution changed: source={source.size}, encoded={encoded.size}"
        )

    source_rgba = source.convert("RGBA")
    encoded_rgba = encoded.convert("RGBA")
    if source_rgba.tobytes() != encoded_rgba.tobytes():
        raise RuntimeError("Decoded WebP pixels differ from the source PNG")


def convert_logo(source_path: Path, output_path: Path, force: bool) -> ConversionResult:
    if output_path.exists() and not force:
        return ConversionResult(source_path, output_path, "skipped", output_path.stat().st_size)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path: Path | None = None

    try:
        with Image.open(source_path) as source:
            source.load()
            output_mode = "RGBA" if "A" in source.getbands() else "RGB"
            encoded_image = source.convert(output_mode)
            metadata = _metadata_for_webp(source)
            temporary_file = tempfile.NamedTemporaryFile(
                prefix=f".{output_path.stem}.",
                suffix=".webp",
                dir=output_path.parent,
                delete=False,
            )
            temporary_path = Path(temporary_file.name)
            temporary_file.close()

            encoded_image.save(
                temporary_path,
                format="WEBP",
                lossless=True,
                method=6,
                exact=True,
                **metadata,
            )
            encoded_image.close()

            with Image.open(temporary_path) as encoded:
                encoded.load()
                _assert_pixel_identity(source, encoded)

        os.replace(temporary_path, output_path)
        temporary_path = None
        return ConversionResult(source_path, output_path, "converted", output_path.stat().st_size)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def convert_directory(source_dir: Path, output_dir: Path, force: bool) -> list[ConversionResult]:
    results: list[ConversionResult] = []
    for source_path in iter_png_files(source_dir):
        output_path = output_dir / f"{source_path.stem}.webp"
        results.append(convert_logo(source_path, output_path, force))
    return results


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    source_dir = args.source
    output_dir = args.output_dir or source_dir

    try:
        results = convert_directory(source_dir, output_dir, args.force)
    except (OSError, RuntimeError, ValueError) as error:
        print(f"Conversion failed: {error}", file=sys.stderr)
        return 1

    converted = sum(result.status == "converted" for result in results)
    skipped = sum(result.status == "skipped" for result in results)
    total_bytes = sum(result.output_bytes for result in results)

    print(
        f"Processed {len(results)} PNG logo(s): "
        f"{converted} converted, {skipped} skipped, "
        f"{total_bytes} output bytes."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
