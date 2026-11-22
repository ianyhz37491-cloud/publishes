# Interactive Portfolio / Serenity IV

A minimalist project index surrounded by a living, explorable meadow. The environmental scene is optional; visitors can reach the work catalogue immediately.

**[Open the site](https://ianyhz37491-cloud.github.io/publishes/)** · [Build and deployment](.github/workflows/pages.yml) · [Audio licences](AUDIO_SOURCES.md) · [Release evidence and next stages](docs/SERENITY_II_RELEASE.md)

## Interface

Three static-host-safe routes use the same persistent React Three Fiber canvas and ambient-audio player.

- `#/` — centred white italic **interactive portfolio** over the meadow; click, scroll, swipe or use keyboard to enter.
- `#/work` — an editorial, responsive catalogue with stable project codes and a sliding underline. Filtering animates excluded tiles out and rearranges remaining tiles using FLIP. One anonymous published slot (**SYS-001**, language-reading environment) opens a photographic editorial project preview with a direct link to its existing public beta. The other 11 slots are labelled with **?** and UNPUBLISHED. No other projects, logos, demo links or case studies are fabricated.
- `#/field` — free exploration with a controlled low-angle camera, adjustable day/night cycle, manual weather, wind, camera reset and return to the previous portfolio state.

A compact sound button persists in the top-right corner of every route. Sound begins **off**, can be enabled or muted at any time, and is faded and optionally low-pass muffled while browsing the work index. The adjacent settings control adjusts overall volume, project-menu volume and muffling.

## Photographic project preview

The catalogue uses an original studio-style layout; it does not copy the screenshots, code or visual assets of RabenRifaie or Madrepunk. The first project has no displayed name because the eventual portfolio naming system is undecided. Its expandable preview uses a **licensed editorial photograph** (see [PHOTO_SOURCES.md](PHOTO_SOURCES.md)), a large centred zoom and a bounded 2.5D illusion built from two masked, slightly offset versions of that photo. The image represents reading, **not a captured product screenshot**. "Visit project" navigates to the actual existing reader beta at `https://margin-language-reader.onrender.com/`. An external host sleeping or returning a transient error remains possible; there is no invented uptime claim.

Desktop pointers reveal the preview on hover, touch users tap the card, keyboard focus opens it, and Escape or close dismisses it. Dismissing while the pointer is still over a card does not repeatedly reopen the preview and block the filters. The original category underline and FLIP animation remain intact.

## Environmental rendering

This project preserves the source architecture and original GPU-instanced grass/wind field of [Zephyr by rether](https://github.com/RetherSzu/zephyr) (MIT; pinned revision `bd74c81efa0c49a8f8acc6cab41550dd2f0d95b0`). The source overlay is in [patches/apply.py](patches/apply.py).

**Meadow continuity:** One Zephyr-derived blade family, one lighting material, world-space wind and terrain height across four overlapping radial bands. The centre retains the original seven-segment silhouette and desktop sampling spacing. Density is tapered stochastically from near through mid to far distances without a rectangular tile boundary. A high-density bridge of actual Zephyr blade geometry retains spatial foliage mass beyond the original square, while the middle and far bands thin progressively with distance. The distant ground receives a tiled procedural blade-texture canopy where literal blades drop below pixel resolution. No sprite shrublets, photographic layers or independent grass-wind systems are used. Sampling lives in `patches/overlay/meadowLayout.ts`.

**Atmosphere:** explicit blue daylight sky, sunrise and sunset, moonlit night, star visibility, several independent cloud forms and gradual clear/overcast/drizzle/rain states. The weather may evolve slowly on its own or be selected from Field settings.

**Weather:** Wind-slanted rain is retained as an isolated particle system. Daisies, butterflies and fireflies have been removed.

**Grass interaction:** a directionally scattered world-aligned wake with irregular edges and different recovery times replaces the original circular cursor sphere. All continuous blade bending remains on the GPU, layered with Zephyr's natural wind. Interaction near the ground raises an existing licensed rustle recording only after the visitor explicitly enables sound.

Quality presets:
- Desktop: 0.025 world-unit centre lattice, with overlapping stochastic mid/far grass bands.
- Touch devices: reduced sampling across all bands, still sharing the desktop blade materials.
- `?quality=low`: explicitly reduced centre/middle/far sampling for software Chromium and limited GPUs.
- WebGL2 unavailable: static poster and functional catalogue; field navigation is disabled.

These settings are sampling rules, not measured performance promises. The wake is still limited to the central 10 × 10 area and its visual naturalness is not yet signed off.

## Verification

[Original Serenity cycle tests](tests/test-serenity.cjs), [catalogue/wake model tests](tests/test-portfolio.cjs), strict TypeScript/Vite build and [desktop/mobile Chromium browser journeys](tests/test-portfolio-browser.cjs) run in GitHub Actions. Browser checks cover landing, filters, deep links, sound activation/mute, mood selection, manual rain, field return and screenshots. Pinned CC0 sound recordings are SHA-verified before browser tests and deployment.

Software-rendered Chromium screenshots use `?quality=low`. They test UI and rendering paths, and multiple field orbits, but **cannot establish perceptual continuity or native Mac Safari/iPhone GPU performance** until screenshots are inspected and target devices are profiled. Physical listening, Safari compatibility and measured FPS remain hardware release gates.

No proprietary portfolio images or private project records are included. [SERENITY_II_RELEASE.md](docs/SERENITY_II_RELEASE.md) records implemented stages and outstanding improvements.
