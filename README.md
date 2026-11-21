# Interactive Portfolio / Serenity II

A minimalist project index surrounded by a living, explorable meadow. The environmental scene is optional; visitors can reach the work catalogue immediately.

**[Open the site](https://ianyhz37491-cloud.github.io/publishes/)** · [Build and deployment](.github/workflows/pages.yml) · [Audio licences](AUDIO_SOURCES.md) · [Release evidence and next stages](docs/SERENITY_II_RELEASE.md)

## Interface

Three static-host-safe routes use the same persistent React Three Fiber canvas and ambient-audio player.

- `#/` — centred white italic **interactive portfolio** over the meadow; click, scroll, swipe or use keyboard to enter.
- `#/work` — an editorial, responsive catalogue with stable project codes and a sliding underline. Filtering animates excluded tiles out and rearranges remaining tiles using FLIP. The 12 slots are **unpublished placeholders**, not real cases or live links.
- `#/field` — free exploration with a controlled low-angle camera, adjustable day/night cycle, manual weather, wind, camera reset and return to the previous portfolio state.

A compact sound button persists in the top-right corner of every route. Sound begins **off**, can be enabled or muted at any time, and is faded and optionally low-pass muffled while browsing the work index. The adjacent settings control adjusts overall volume, project-menu volume and muffling.

## Environmental rendering

This project preserves the source architecture and original GPU-instanced grass/wind field of [Zephyr by rether](https://github.com/RetherSzu/zephyr) (MIT; pinned revision `bd74c81efa0c49a8f8acc6cab41550dd2f0d95b0`). The source overlay is in [patches/apply.py](patches/apply.py).

**Meadow continuity:** the former visible 10 × 10 floating patch is now a height-consistent, 180 × 180 terrain with a lower-density outer grass field, distance fog, and restrained camera orbit limits. Far scenery receives fewer blades than the foreground; the renderer does not attempt 160k blades for every distant tile.

**Atmosphere:** explicit blue daylight sky, sunrise and sunset, moonlit night, star visibility, several independent cloud forms and gradual clear/overcast/drizzle/rain states. The weather may evolve slowly on its own or be selected from Field settings.

**Vegetation and wildlife:** instanced daisies sway independently; butterflies move during suitable daylight; firefly sprites appear mainly at night; wind-slanted rain particles respond to rainfall strength. The wildlife and rain are quality-budgeted by device class.

**Grass interaction:** a directionally scattered world-aligned wake with irregular edges and different recovery times replaces the original circular cursor sphere. All continuous blade bending remains on the GPU, layered with Zephyr's natural wind. Interaction near the ground raises an existing licensed rustle recording only after the visitor explicitly enables sound.

Presets:
- Desktop: 400 × 400 foreground grass blades (160,000), plus sparse distant foliage.
- Coarse-pointer devices: 220 × 220 foreground blades (48,400).
- Explicit `?quality=low`: 112 × 112 broader low-power foreground blades (12,544), plus reduced wildlife and distant tufts.
- WebGL2 unavailable: static gradient poster with a fully operable catalogue, with free roam disabled honestly.

These are budgets, **not measured FPS guarantees**.

## Verification

[Original Serenity cycle tests](tests/test-serenity.cjs), [catalogue/wake model tests](tests/test-portfolio.cjs), strict TypeScript/Vite build and [desktop/mobile Chromium browser journeys](tests/test-portfolio-browser.cjs) run in GitHub Actions. Browser checks cover landing, filters, deep links, sound activation/mute, mood selection, manual rain, field return and screenshots. Pinned CC0 sound recordings are SHA-verified before browser tests and deployment.

Software-rendered Chromium screenshots use `?quality=low`. They verify real WebGL and UI interactions, **not full-density Mac Safari performance, artistic realism or iPhone GPU behaviour**. Physical listening, Safari compatibility and measured FPS remain hardware release gates.

No proprietary portfolio images or private project records are included. [SERENITY_II_RELEASE.md](docs/SERENITY_II_RELEASE.md) records implemented stages and outstanding improvements.
