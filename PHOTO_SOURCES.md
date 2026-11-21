# Portfolio photographic media sources

## SYS-001 — editorial preview photograph

- **Photographer:** Liana S (@cherstve_pechivo)
- **Title:** *Open book sits under sunlight*
- **Original:** https://unsplash.com/photos/open-book-sits-under-sunlight-QkqxqzabCMc
- **Licensed under:** Unsplash License, https://unsplash.com/license — royalty-free display, adaptation and distribution for this portfolio; attribution included here voluntarily.
- **Reproducible image URL:** https://images.unsplash.com/photo-1752347285110-06289f125499?fm=jpg&fit=crop&w=1400&q=80
- **Use:** A photographic editorial representation of reading. It is **not a screenshot of the user-built reading application**; no third-party product interface is presented as the user's work.
- **Build:** Downloaded into the static site at build time, checked as a JPEG with a nonzero size. If the image host fails, CI fails rather than publishing broken media.

The photographed book is composited in the project preview as a bounded CSS foreground/background parallax experiment using two masked copies of the same image. No proprietary imagery, renders, 3D assets or layout assets are copied from the studios referenced by the user. A high-quality 2.5D *landscape* would additionally require a depth map, segmentation around individual grass/subject edges, and inpainted regions exposed by camera movement; none of those are falsely claimed by this preview effect.


## Photographic Meadow Depth / 01 — independently authored layering

- **Photographer:** Spencer DeMera (@spencer_demera)
- **Original photo:** https://unsplash.com/photos/green-meadow-with-a-path-under-a-blue-sky-PD40GTyzvlQ
- **Unsplash photo ID:** `photo-1644147184714-5a79cbf24333`
- **Source image URL:** https://images.unsplash.com/photo-1644147184714-5a79cbf24333?fm=jpg&fit=crop&w=2400&q=84
- **License:** Unsplash License, https://unsplash.com/license (photograph distributed and adapted under terms of source license).
- **Assets generated at build:** original photograph, local inpainted background, independently alpha-matted grass-stem layer and near-field layer, alpha mask and a provenance JSON with source hash and extraction statistics.
- **Pipeline:** `patches/build-photo-depth.py`. A conservative image-processing cutout using actual photographed edges, a gradually opaque near-field and small-gap inpainting. It **does not** purport to recover metric depth or all previously hidden image information. The orb and bounded motion are independently authored CSS/React, not copied from the user's reference studios.
- **Exposure:** opt-in from the `#/field` route using the **Photographic study** toggle. The pre-existing WebGL meadow remains the default and is not erased. Do not promote this photo scene to the main landing automatically without full-resolution desktop/mobile/Safari visual approval.

Source and masked layers must be reviewed at real pixel scale; a successful alpha-value test does not establish perceptual realism. This image uses spring grasses and a distant hill rather than falsely claiming to be the original Zephyr meadow photograph.
