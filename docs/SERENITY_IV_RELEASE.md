# Serenity IV — Unified Meadow release evidence

**Date:** 22 November 2026 (Australia/Sydney)  
**Repository:** `ianyhz37491-cloud/publishes`  
**Branch:** `feature/serenity-iv-unified-meadow`  
**Pull request:** [#5](https://github.com/ianyhz37491-cloud/publishes/pull/5)

## Scope and tested implementation

The source overlay now renders original Zephyr curved grass through **four overlapping radial bands** with one instanced shader and global wind clock. A denser bridge of actual Zephyr geometry spans the boundary of the former 10 × 10 centre, while terrain-level fine blade texture supports genuinely distant pixels. Near-mesh root height and 180 × 180 terrain share `getHeight(x,-z)`; stochastic sampling is seeded in world coordinates. Desktop, touch and low presets have bounded instance counts.

The independent photographic *meadow* (orb/parallax mode), its toggle, assets, pipeline and stylesheet are gone. The flowers, butterflies and fireflies were removed; rain remains separate. The SYS-001 licensed editorial **project preview photo** intentionally remains. Routes, work filters, audio, daylight/night/rain, existing wake and camera control are preserved.

## Browser and visual evidence

- Prior production baseline: [GitHub Actions 44903987790](https://github.com/ianyhz37491-cloud/publishes/actions/runs/44903987790), screenshots in `portfolio-browser-qa`.
- Initial unified grass: [44971155148](https://github.com/ianyhz37491-cloud/publishes/actions/runs/44971155148). All tests passed but visible bald field persisted in `desktop-meadow-low-orbit.png` and `mobile-meadow-default.png`. Rejected.
- Procedural crossed clump cutouts: [44971822466](https://github.com/ianyhz37491-cloud/publishes/actions/runs/44971822466). Tests passed but screenshots showed black shrub-like cards. Rejected and deleted.
- Four-band true-blade bridge: [44972447772](https://github.com/ianyhz37491-cloud/publishes/actions/runs/44972447772), screenshot artifact `portfolio-browser-qa`. Production build, original lighting/catelogue/wake tests, deterministic four-band LOD tests, desktop/mobile Chromium smoke journeys and shader-error assertions passed. I inspected actual daylight and low-angle screenshots; they show substantially more continuous grass and no shrub-card substitution. The previous high-orbit test drag was too large and moved the camera into the near foliage; it is being corrected and must be re-tested.

## Performance and unverified hardware gates

The browser was headless Chromium/SwiftShader with `?quality=low`, not native Apple hardware or full-density desktop. In run 44972447772, a short rAF sample reported approximately **500 ms median** desktop frame interval; mobile samples ranged from **16.7 ms to 2,033 ms**. The software renderer has poor and variable throughput; these timings do **not** predict actual native performance. Desktop full-density and mobile Safari frame rates, physical touch smoothness and wake realism require device testing. No FPS guarantee is made.

The central wake remains bounded to the original 10 × 10 area and may still resemble a trench. The terrain microtexture is not photorealistic; the target is coherent stylized grass. The final result is qualitatively improved in inspected low-mode screenshots, not certified on native devices.

## Release conditions

Merge only after the corrected orbit screenshots and regression run are reviewed and no significant visual failure is identified. After merge, verify the **actual public GitHub Pages commit** and re-check the live routes. Until then, `main` remains the public baseline. Do not use a green build alone as a release gate.
