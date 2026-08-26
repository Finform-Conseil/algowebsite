#!/usr/bin/env python3
"""Download official Colombo Stock Exchange company logos."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import urlencode, urljoin
from urllib.request import Request, urlopen

API = "https://www.cse.lk/api/"
CDN = "https://cdn.cse.lk/cmt/"
USER_AGENT = "AfriMarket-CSE-Logo-Collector/1.0"


def post_json(endpoint: str, fields: dict[str, str] | None, timeout: float) -> object:
    request = Request(
        urljoin(API, endpoint),
        data=urlencode(fields or {}).encode(),
        headers={"Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT},
        method="POST",
    )
    with urlopen(request, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError(f"{endpoint}: HTTP {response.status}")
        return json.loads(response.read().decode())


def collect(output: Path, timeout: float) -> tuple[int, int]:
    output.mkdir(parents=True, exist_ok=True)
    catalog = post_json("detailedTrades", None, timeout)
    rows = catalog if isinstance(catalog, list) else catalog.get("reqDetailTrades", [])
    symbols = sorted({str(row["symbol"]).strip() for row in rows if isinstance(row, dict) and row.get("symbol")})
    if not symbols:
        raise RuntimeError("CSE returned no symbols")
    records: list[dict[str, object]] = []
    failures: list[dict[str, str]] = []
    for symbol in symbols:
        try:
            data = post_json("companyInfoSummery", {"symbol": symbol}, timeout)
            path = str((data.get("reqLogo") or {}).get("path", "")).strip()
            if not path:
                raise RuntimeError("missing official logo path")
            source = urljoin(CDN, path.removeprefix("cmt/"))
            request = Request(source, headers={"Accept": "image/*", "User-Agent": USER_AGENT})
            with urlopen(request, timeout=timeout) as response:
                body = response.read()
                content_type = response.headers.get("Content-Type", "")
            if not body or not content_type.startswith("image/"):
                raise RuntimeError("invalid image response")
            safe = "".join(char if char.isalnum() else "_" for char in symbol)
            target = output / f"{safe}{Path(path).suffix.lower() or '.img'}"
            target.write_bytes(body)
            records.append({"symbol": symbol, "source_url": source, "local_path": str(target), "content_type": content_type, "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()})
        except (OSError, RuntimeError, ValueError, KeyError, AttributeError) as error:
            failures.append({"symbol": symbol, "reason": str(error)})
    manifest = {"exchange": "CSE", "api": API, "logo_cdn": CDN, "records": records, "failures": failures}
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return len(records), len(failures)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("public/logos-cse"))
    parser.add_argument("--timeout", type=float, default=20)
    parser.add_argument("--allow-failures", action="store_true")
    args = parser.parse_args()
    try:
        downloaded, failed = collect(args.output, args.timeout)
    except (OSError, RuntimeError, ValueError) as error:
        print(f"CSE collection failed: {error}")
        return 1
    print(json.dumps({"downloaded": downloaded, "failed": failed}))
    return 2 if failed and not args.allow_failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
