# Photographic Depth — researched implementation route

**Status:** engineering decision / constrained prototype only, not a released photographic meadow.  
**Portfolio source:** `patches/overlay/ProjectSpotlight.tsx`  
**Current first-stage evidence:** licensed photo layers offset subtly inside the one published project preview; browser screenshots in GitHub Actions. No photorealistic *world* has been built yet.

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

## Next gated experiment (not yet implemented)

1. Select or create a legitimately usable high-resolution meadow scene with excellent real photography, focal direction, distinct foreground vegetation and realistic free space for an object. Record asset rights and provenance.
2. Produce an inspectable depth map and fine alpha matte for grass/flowers, plus an inpainted image of the space behind the vegetation. Reject if haloing, holes or edge shimmer are obvious at 100% zoom.
3. Render at original desktop and mobile viewport with a fixed-origin camera and bounded mouse parallax, *no invented endless terrain*. Independently animate a ball under foreground occlusion and a small subset of grass edge elements. Include a still-image reduced-motion fallback.
4. Compare actual browser recordings/screenshots against the user-supplied visual reference at daylight, dusk and mobile. Measure frame-time, memory and input latency on Safari/Apple Silicon.
5. **Promote to landing only if** the result is convincingly photographic, no visible matte/alpha artefacts, no warped backgrounds or fake grass twigs, no copyrighted reference assets, and better user experience/performance than the existing 3D option.

Avoid adding cartoon butterflies, procedural daisies, generic particle fog and toy-style spheres merely because they are easy. The main goal is credible immersive portfolio art direction.
