# Logo normalization contract

## Canonical visual contract

Every exchange logo must be rendered on a 256 x 256 square canvas with an opaque white background. The source aspect ratio must be preserved. The visible artwork must be centered and bounded to 70 percent of the canvas, leaving consistent breathing room. The final file must be lossless WebP.

The normalizer must never stretch, distort, crop meaningful artwork, substitute a placeholder, or silently discard a source failure.

## Collection strategy and source of truth

The live exchange API is the source of truth for completeness. Before downloading anything, enumerate the complete instrument set returned by the API, paginate until the API reports no further records, normalize ticker names using the application contract, and keep the API count, unique ticker count, manifest count, and WebP count as separate audit values. A collection is not complete merely because a directory contains many files.

Use a fallback ladder when the preferred logo endpoint fails or returns a generic favicon: issuer website assets first, the exchange's own issuer pages or symbol catalogue second, then a reputable public brand reference. Record the exact source URL and source type for every fallback. Never draw, recreate, or infer a logo from a ticker abbreviation. If no verifiable image can be found, record an explicit failure and keep the ticker visible in the audit instead of silently producing initials.

## Source integrity and processing order

The pipeline is strictly:

1. Download and preserve the original source bytes.
2. Validate that the source is a readable image.
3. Compute the original SHA-256.
4. Deduplicate exact source bytes by SHA-256 before normalization.
5. Normalize each unique original exactly once.
6. Compute the normalized WebP SHA-256.
7. Deduplicate normalized WebP bytes again.
8. Write a manifest containing source URL, original hash, normalized hash, canonical file, aliases, and failures.

The source manifest must also retain the exchange, ticker, source type, and retrieval status. A successful record is valid only when its canonical WebP exists locally.

Never normalize a WebP that was already produced by this pipeline. Repeated resize/crop passes can amplify blur and destroy small text. If a new visual contract is required, re-download the original source and rebuild from it.

## Crop rules

Many exchange logos arrive as JPEG/PNG files with an opaque white background. Alpha-only bounding boxes are invalid for those files because the entire canvas is opaque.

The crop algorithm must therefore:

- composite transparency onto white first;
- detect the bounding box of pixels that differ from white by a documented threshold;
- preserve dark or colored text and marks;
- reject empty or unreadable images;
- then resize the detected artwork once into the 70 percent bounds.

After normalization, inspect text-bearing marks for legibility. A logo whose name is rendered as an unreadable blur, whose artwork becomes a single indistinguishable pixel cluster, or whose meaningful text is lost must be rejected and rebuilt from the original source at a larger artwork bound or with a better source. Do not solve illegibility by repeatedly resizing an already-normalized WebP.

This prevents the failure where a small logo remains tiny inside a large white canvas.

## Duplicate rules

Exact byte duplicates are only the first gate. A second perceptual comparison is mandatory because two downloads of the same brand can have different bytes, dimensions, compression, or transparent padding. Use SHA-256 for automatic equality, then compare a white-composited 32x32 thumbnail and the issuer/ticker provenance before declaring a semantic duplicate.

When duplicates exist:

- retain one deterministic canonical filename;
- remove exact duplicates automatically;
- remove a visually similar file only when its issuer/ticker provenance proves it is an alias of the retained issuer;
- record every removed filename as an alias;
- preserve symbol-to-canonical-logo mappings in the manifest;
- quarantine uncertain visual matches for human review; never merge them solely because they look alike.

Run duplicate detection at three levels: ticker/file-name identity, exact SHA-256, and perceptual identity after white compositing. Visually identical logos with different ticker names must share one canonical file only when issuer provenance confirms the relationship; otherwise preserve both and flag them for review. A different filename is not evidence that a second logo is unique.

## Required acceptance checks

A collection is complete only when:

- every generated WebP is readable;
- every generated WebP is exactly 256 x 256;
- every generated WebP has an opaque white background;
- no normalized file has a duplicate SHA-256;
- no unresolved perceptual duplicate remains among records belonging to the same issuer;
- every removed alias resolves to an existing canonical file;
- the manifest is valid JSON;
- failures are explicit and countable;
- no source is silently replaced or omitted;
- API unique ticker count equals manifest ticker count, unless each excluded ticker is listed in an explicit failure set;
- manifest ticker count equals the number of canonical WebP files referenced by the manifest;
- each ticker resolves through the application logo registry, including normalized aliases;
- a browser smoke check of the title-selection modal confirms that real images load and that failed entries are not silently rendered as initials.

Reusable implementations: `scripts/normalize_logo_assets.py` and `scripts/audit_logo_duplicates.py`

Run the audit after every collection import; a non-zero exit means the collection must not be integrated.

Reusable implementation: `scripts/normalize_logo_assets.py`

Example:

```bash
python3 scripts/normalize_logo_assets.py public/logos-cse
```

For a correction to an already-normalized collection, delete the generated WebP output, download the original source files again, and run the normalizer once. Do not use already-normalized WebP files as new source material.

## Operational lessons

The following failures are considered known regressions:

- trusting the number of files instead of the complete API inventory;
- treating a favicon as the issuer's logo without visual inspection;
- stopping after the first source endpoint fails;
- accepting a tiny or blurry logo because it technically fits the canvas;
- declaring a collection duplicate-free without a perceptual audit;
- updating assets without updating the source and normalization manifests.

Every new collection must demonstrate the opposite with machine-readable counts, source provenance, duplicate-audit output, and a final modal check.
