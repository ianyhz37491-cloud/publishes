# Photographic Depth — researched implementation route

**Status:** photographic-depth experiment implemented on **draft PR #4**, **not promoted to landing**.  
**Portfolio sources:** `patches/overlay/ProjectSpotlight.tsx`; `patches/overlay/PhotographicMeadow.tsx`; `patches/build-photo-depth.py`.  
**Build proof:** GitHub Actions retrieved and processed the licensed source successfully at 1920 × 1280; alpha-matte occupancy in the central photographed stem band was 11.19%, with opaque near-ground layer. Desktop and mobile Chromium screenshots were visually reviewed. The first run identified a genuine lazy-stage animation lifecycle defect (corrected); a subsequent run verified parallax and exposed a route-transition test race (corrected). **Full CI run [#44903040481](https://github.com/ianyhz37491-cloud/publishes/actions/runs/44903040481) passed** production compilation, existing tests, desktop/mobile browser journeys, source fetch and asset integrity. The decoded screenshots show real grasses layered over the glass-like orb in a warm spring meadow. They also exposed undersized mobile navigation controls; these were refined afterward and must receive an additional CI run. Actual Safari on the user's Mac, touch hardware and perceptual evaluation by the user remain unverified.

## References and attribution

- User-selected references, **visual reference only** (do not reuse their imagery/code): https://www.rabenrifaie.com/ and https://www.madrepunk.com/ . RabenRifaie is a Framer-based studio site featuring custom 3D animation and tactile materials, not proof that it uses 2D sprites; Madrepunk describes a Framer WebGL slider and interactive infinite gallery.
- Shih et al., *3D Photography using Context-aware Layered Depth Inpainting* (2020): https://shihmengli.github.io/3D-Photo-Inpainting/ . RGB-D input, context-aware inpainting of previously occluded content, and constrained new camera viewpoints.
- Open-source landscape pipeline example: https://github.com/shfdlxj/depth-scape — layered relative-depth image cutouts, occlusion boundaries, inpainted disocclusion and bounded parallax. Its description correctly disclaims a metrically accurate navigable 3D scene. Inspect license/dependencies and actual samples before importing any source.
- Layer/mesh web viewer experiment: https://github.com/nermadie/2.5D_Depth_Studio — independent foreground layers or Three.js depth-displaced mesh. Evaluate sample output and source license separately.

## What a high-quality static photograph can do

A photo's lighting, reflectance, blades, shadows and colour are real, so its visual fidelity can exceed cheap procedurally assembled flowers or grass. Camera motion produces parallax only if the image is divided along occlusion boundaries, front/middle/background move by physically plausible amounts, and vacated pixels have been filled.

For *a ball behind photographed grass*, a foreground matte must be detailed enough to retain thin stems, small gaps and correct depth order; the ball must be composited behind the grass matte but in front of the midground. Add properly matched lighting/contact shadows to the ball and depth of field. A polygon cutout over the entire grass band is **not** an acceptable substitute. Characterised, independent blade motion is limited unless stems are rigged; arbitrary side-to-side camera travel reveals previously invisible surfaces that a single photo cannot reconstruct.

## Decision

- **Portfolio cover / selected-work popup:** photographic layers and bounded pointer offsets are a valid small, fast enhancement. Already coded and tested.
- **Homepage backdrop:** a photo-based 2.5D alternative may be stronger than the current WebGL meadow when the camera motion is limited to a few degrees. Build an isolated scene *beside* the existing field; do not replace or disable the working original during evaluation.
- **Free-roam:** keep the actual shader-driven geometry and native terrain (or a professionally captured multi-view/NeRF/3D Gaussian Splat scene with credible rights/performance) because a single photograph cannot preserve arbitrary camera yaw, perspective and local grass contacts.

## Implemented bounded experiment — independent preview route state

- The main WebGL field remains intact; users opt into **Photographic study** from the `#/field` controls. This is not an infinite photographic 3D world and does not replace the landing.
- A free-to-use [Spencer DeMera photo](https://unsplash.com/photos/green-meadow-with-a-path-under-a-blue-sky-PD40GTyzvlQ) is fetched at build time. The exact hash, dimensions, matte-occupancy and image licence go into `media/meadow-depth/provenance.json`; outputs include `background.webp`, `stems.webp`, `near.webp`, `matte.png`.
- Python/OpenCV performs high-frequency vegetation edge separation and intentionally limited fine-stem inpainting; separate stem and near layers use small independent parallax offsets. An opt-in glass-like CSS sphere animates *behind* these photographic alpha planes. The orb is art directed rather than optically calibrated; do not call it physically refractive.
- The WebGL loop switches to a demand-based state while this fixed-vantage photo view is shown, and source layers load only after the user opens the study.
- Desktop Chromium screenshots show photographic stems crossing the sphere, not a plain circular clip-path on top of stock photography. But judge perceived realism at 100% and on the user's Safari before promoting.
- Current known limits: single photograph, basic automatic edge matte, approximate foreground-to-background parallax, incomplete disocclusion, warm dry grass unlike the original Zephyr lush green field, no independent rigging of each photographed stalk.

## Next gated experiment (now part implemented; further work remains)

1. Select or create a legitimately usable high-resolution meadow scene with excellent real photography, focal direction, distinct foreground vegetation and realistic free space for an object. Record asset rights and provenance.
2. Produce an inspectable depth map and fine alpha matte for grass/flowers, plus an inpainted image of the space behind the vegetation. Reject if haloing, holes or edge shimmer are obvious at 100% zoom.
3. Render at original desktop and mobile viewport with a fixed-origin camera and bounded mouse parallax, *no invented endless terrain*. Independently animate a ball under foreground occlusion and a small subset of grass edge elements. Include a still-image reduced-motion fallback.
4. Compare actual browser recordings/screenshots against the user-supplied visual reference at daylight, dusk and mobile. Measure frame-time, memory and input latency on Safari/Apple Silicon.
5. **Promote to landing only if** the result is convincingly photographic, no visible matte/alpha artefacts, no warped backgrounds or fake grass twigs, no copyrighted reference assets, and better user experience/performance than the existing 3D option.

Avoid adding cartoon butterflies, procedural daisies, generic particle fog and toy-style spheres merely because they are easy. The main goal is credible immersive portfolio art direction.
