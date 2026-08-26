#!/usr/bin/env python3
"""Normalize exchange logos to the AfriMarket visual contract."""
from __future__ import annotations
import argparse, hashlib, json, tempfile
from pathlib import Path
from PIL import Image, ImageChops
IMAGE_EXTENSIONS={".png",".jpg",".jpeg",".gif",".bmp",".tif",".tiff",".webp"}
CANVAS_SIZE=256
ARTWORK_RATIO=0.70
def normalize(path: Path) -> tuple[Path,str]:
    with Image.open(path) as source:
        source=source.convert("RGBA"); white=Image.new("RGBA",source.size,(255,255,255,255)); white.alpha_composite(source); rgb=white.convert("RGB"); diff=ImageChops.difference(rgb,Image.new("RGB",rgb.size,(255,255,255))); diff=diff.point(lambda pixel: 255 if pixel > 10 else 0); bbox=diff.getbbox()
        if bbox: source=source.crop(bbox)
        if source.width==0 or source.height==0: raise ValueError("image contains no visible pixels")
        limit=int(CANVAS_SIZE*ARTWORK_RATIO); scale=min(limit/source.width,limit/source.height)
        resized=source.resize((max(1,round(source.width*scale)),max(1,round(source.height*scale))),Image.Resampling.LANCZOS)
        canvas=Image.new("RGBA",(CANVAS_SIZE,CANVAS_SIZE),(255,255,255,255))
        canvas.alpha_composite(resized,((CANVAS_SIZE-resized.width)//2,(CANVAS_SIZE-resized.height)//2))
    target=path.with_suffix(".webp")
    with tempfile.NamedTemporaryFile(dir=path.parent,suffix=".webp",delete=False) as temporary: temporary_path=Path(temporary.name)
    try:
        canvas.convert("RGB").save(temporary_path,"WEBP",lossless=True,method=6); digest=hashlib.sha256(temporary_path.read_bytes()).hexdigest(); temporary_path.replace(target)
    finally: temporary_path.unlink(missing_ok=True)
    if path!=target: path.unlink()
    return target,digest
def main() -> int:
    parser=argparse.ArgumentParser(); parser.add_argument("directory",type=Path); args=parser.parse_args(); records=[]; failures=[]
    for path in sorted(args.directory.iterdir()):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            try:
                target,digest=normalize(path); records.append({"file":str(target),"sha256":digest,"canvas":[CANVAS_SIZE,CANVAS_SIZE],"background":"#ffffff","artwork_ratio":ARTWORK_RATIO})
            except (OSError, ValueError) as error:
                failures.append({"file":str(path),"reason":str(error)})
    manifest=args.directory/"normalization-manifest.json"; manifest.write_text(json.dumps({"contract":"logo-normalization-v1","records":records,"failures":failures},indent=2)+"\n",encoding="utf-8"); print(json.dumps({"normalized":len(records),"failed":len(failures),"manifest":str(manifest)})); return 0
if __name__=="__main__": raise SystemExit(main())
