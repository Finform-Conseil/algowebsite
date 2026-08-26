#!/usr/bin/env python3
"""Collect JSE equity issuer logos from the official issuer catalog."""
from __future__ import annotations

import hashlib
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

CATALOG_URL = "https://clientportal.jse.co.za/_vti_bin/JSE/CustomerRoleService.svc/GetAllIssuers"
LOGO_CDN = "https://cdn.tickerlogos.com/"
OUTPUT = Path("public/logos-jse")
TIMEOUT = 2
USER_AGENT = "AfriMarket-logo-collector/1.0"


def request_bytes(url: str, payload: bytes | None = None) -> bytes:
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json, image/*"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    request = Request(url, data=payload, headers=headers, method="POST" if payload else "GET")
    with urlopen(request, timeout=TIMEOUT) as response:
        data = response.read()
        if not data:
            raise ValueError("empty response")
        return data


def domain_from_website(website: str | None) -> str | None:
    if not website:
        return None
    candidate = website.strip()
    if not candidate:
        return None
    if not re.match(r"^https?://", candidate, flags=re.IGNORECASE):
        candidate = "https://" + candidate
    hostname = (urlparse(candidate).hostname or "").lower().strip(".")
    if hostname.startswith("www."):
        hostname = hostname[4:]
    if not re.fullmatch(r"[a-z0-9.-]+", hostname) or "." not in hostname:
        return None
    return hostname


def safe_stem(alpha_code: str, master_id: int) -> str:
    value = re.sub(r"[^a-z0-9]+", "_", alpha_code.lower()).strip("_")
    return value or f"issuer_{master_id}"


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    payload = json.dumps({"filterLongName": "", "filterType": "Equity Issuer"}).encode()
    issuers = json.loads(request_bytes(CATALOG_URL, payload))
    records: list[dict] = []
    failures: list[dict] = []
    seen_hashes: dict[str, str] = {}
    def collect(issuer):
        code = issuer.get("AlphaCode") or ""
        master_id = issuer.get("MasterID")
        website = issuer.get("Website")
        domain = domain_from_website(website)
        base = {"master_id": master_id, "symbol": code, "name": issuer.get("LongName"), "website": website, "domain": domain, "source_catalog": CATALOG_URL}
        if not domain:
            return base, None, "missing_or_invalid_website"
        source_url = LOGO_CDN + domain
        try:
            return {**base, "source_url": source_url}, request_bytes(source_url), None
        except (HTTPError, URLError, OSError, ValueError, TypeError) as error:
            return {**base, "source_url": source_url}, None, str(error)

    ordered = sorted(issuers, key=lambda item: (item.get("AlphaCode") or "", item.get("MasterID", 0)))
    with ThreadPoolExecutor(max_workers=12) as pool:
        results = list(pool.map(collect, ordered))
    for base, image, error in results:
        if error:
            failures.append({**base, "reason": error})
            continue
        digest = hashlib.sha256(image).hexdigest()
        if digest in seen_hashes:
            records.append({**base, "original_sha256": digest, "file": seen_hashes[digest], "alias_of": seen_hashes[digest]})
            continue
        filename = safe_stem(base["symbol"], int(base["master_id"])) + ".png"
        (OUTPUT / filename).write_bytes(image)
        seen_hashes[digest] = filename
        records.append({**base, "original_sha256": digest, "file": filename})
    manifest = {"exchange": "JSE", "catalog_url": CATALOG_URL, "logo_source": "AllInvestView Ticker Logos CDN", "logo_source_url": "https://www.allinvestview.com/tools/ticker-logos/", "records": records, "failures": failures}
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"catalog_issuers": len(issuers), "downloaded_unique": len(seen_hashes), "records": len(records), "failures": len(failures), "output": str(OUTPUT)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
