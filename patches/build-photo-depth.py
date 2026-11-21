#!/usr/bin/env python3
"""Build deterministic, source-audited photographic depth layers.

This is a *bounded* view-synthesis asset, not monocular metric depth estimation.
It extracts genuinely photographed fine grass edges (no polygon plant cutouts),
inpaints the occluded background, and emits an inspectable alpha matte.
The original photograph and author credit are separate from generated layers.
"""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

SOURCE_URL="https://unsplash.com/photos/green-meadow-with-a-path-under-a-blue-sky-PD40GTyzvlQ"
PHOTOGRAPHER="Spencer DeMera (@spencer_demera)"
LICENSE_URL="https://unsplash.com/license"
MAX_WIDTH=1920


def smoothstep(lo:float,hi:float,x:np.ndarray)->np.ndarray:
    t=np.clip((x-lo)/(hi-lo),0,1)
    return t*t*(3-2*t)


def derive_matte(rgb:np.ndarray)->np.ndarray:
    """Alpha from fine photograph detail and vegetation colour, not drawn polygons.

    Tall stems in the upper meadow contrast with smoother sky/distant hills.
    The lower meadow is opaque to allow actual depth crossings; a soft gradual
    transition prevents a horizontal cut-out boundary.
    """
    h,w=rgb.shape[:2]
    hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV).astype(np.float32)
    grey=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY).astype(np.float32)
    blur=cv2.GaussianBlur(grey,(0,0),11.0)
    fine=np.abs(grey-blur)
    # A narrow elongated filter captures upright stems but not entire fields.
    top_hat=cv2.morphologyEx(grey.astype(np.uint8),cv2.MORPH_TOPHAT,
        cv2.getStructuringElement(cv2.MORPH_RECT,(11,1))).astype(np.float32)
    black_hat=cv2.morphologyEx(grey.astype(np.uint8),cv2.MORPH_BLACKHAT,
        cv2.getStructuringElement(cv2.MORPH_RECT,(11,1))).astype(np.float32)
    hch,sch,vch=hsv[:,:,0],hsv[:,:,1],hsv[:,:,2]
    vegetation=((hch>=8)&(hch<=90)&(sch>31)&(vch<245)).astype(np.float32)
    # Stems can be pale golden, green or naturally shadowed. Exclude obvious blue.
    bluish=(rgb[:,:,2].astype(np.float32)>rgb[:,:,0].astype(np.float32)*1.12)&(
        rgb[:,:,2].astype(np.float32)>rgb[:,:,1].astype(np.float32)*1.02)
    vegetation*=np.where(bluish,.08,1.0)
    line_score=np.maximum(fine*.72,np.maximum(top_hat,black_hat)*.87)
    stem=np.clip((line_score-5.5)/22,0,1)*vegetation
    stem=cv2.GaussianBlur(stem,(3,3),.65)
    y=np.linspace(0,1,h,dtype=np.float32)[:,None]
    # Upper stem cutouts: no forced dark border along an arbitrary polygon.
    upper=smoothstep(.20,.39,y)*(1-smoothstep(.63,.82,y))
    # Fine grass + flowers become an opaque near-field only toward the bottom.
    lower=smoothstep(.64,.98,y)
    alpha=np.maximum(stem*upper*.97,lower)
    # A little alpha where a very fine vertical plant intersects the background.
    return np.uint8(np.clip(alpha*255,0,255))


def process(source:Path,out:Path)->dict:
    if not source.exists() or source.stat().st_size<35000:
        raise ValueError("Photograph missing or too small")
    raw=source.read_bytes()
    if not raw.startswith(b'\xff\xd8\xff'):
        raise ValueError("Expected a genuine JPEG source")
    with Image.open(source) as opened:
        image=opened.convert("RGB")
    if image.width<1000 or image.height<600:
        raise ValueError(f"Insufficient source resolution {image.size}")
    if image.width>MAX_WIDTH:
        image.thumbnail((MAX_WIDTH, MAX_WIDTH),Image.Resampling.LANCZOS)
    rgb=np.asarray(image)
    h,w=rgb.shape[:2]
    alpha=derive_matte(rgb)
    # Only inpaint isolated stems; reconstructing a whole field from a single
    # photograph would be an unsupported claim.
    inpaint_mask=((alpha>76)&(np.arange(h)[:,None]<h*.76)).astype(np.uint8)*255
    inpaint_mask=cv2.morphologyEx(inpaint_mask,cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(3,3)))
    # Inpaint only thin/small sections; preserve larger actual photographed areas.
    components,labels,stats,_=cv2.connectedComponentsWithStats(inpaint_mask,8)
    limited=np.zeros_like(inpaint_mask)
    for i in range(1,components):
        x,y,cw,ch,area=stats[i]
        if area<1400 and cw<145 and ch<230:
            limited[labels==i]=255
    safe_bg=cv2.inpaint(cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR),limited,3,cv2.INPAINT_TELEA)
    background=cv2.cvtColor(safe_bg,cv2.COLOR_BGR2RGB)
    out.mkdir(parents=True,exist_ok=True)
    Image.fromarray(rgb).save(out/"original.webp",format="WEBP",quality=84,method=6)
    Image.fromarray(background).save(out/"background.webp",format="WEBP",quality=86,method=6)
    Image.fromarray(np.dstack((rgb,alpha))).save(out/"foreground.webp",
            format="WEBP",lossless=True,method=6)
    Image.fromarray(alpha).save(out/"matte.png")
    transparent=float((alpha[h//3:int(h*.65)]>175).mean())
    bottom=float((alpha[int(h*.94):]>230).mean())
    if not .001<transparent<.58:
        raise ValueError(f"Fine foreground extraction is implausible: {transparent:.4f}")
    if bottom<.2:
        raise ValueError("Foreground bottom is not sufficiently opaque")
    report={
      "source":SOURCE_URL,"photographer":PHOTOGRAPHER,"license":LICENSE_URL,
      "source_sha256":hashlib.sha256(raw).hexdigest(),
      "algorithm":"photo-derived fine-stem vegetation matte and small-gap Telea inpainting",
      "resolution":[w,h],
      "upper_stem_opaque_fraction":round(transparent,4),
      "bottom_opaque_fraction":round(bottom,4),
      "caveats":["Relative layering only, no calibrated scene geometry.",
                 "Only small photographed stem gaps are inpainted.",
                 "Large camera translations or full 360-degree orbit are unsupported."]
    }
    (out/"provenance.json").write_text(json.dumps(report,indent=2)+"\n")
    return report


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("source",type=Path)
    parser.add_argument("output",type=Path)
    a=parser.parse_args()
    print(json.dumps(process(a.source,a.output),indent=2))
