# Serenity IV — Unified Meadow (implementation handoff)

**Prepared:** 22 Nov 2026, Australia/Sydney
**Work repository:** `ianyhz37491-cloud/publishes`
**Implementation branch:** `feature/serenity-iv-unified-meadow`
**Baseline:** `main` as of handoff, after the photographic-depth experiment was merged.
**Task type:** IMPLEMENT, TEST, REVIEW, DEPLOY. Not another plan, prototype mockup, illustration or strategy essay.

## User decision — unequivocal

The screenshot supplied 22 Nov (~11:50 AM AEDT) shows a sharp visual transition between the good, lush central grass patch and the sparse, dark, line-like distant "field". The user explicitly rejects the newly introduced photographic meadow as poor and unrelated to the intended direction. They want the *existing high-quality interactive grass itself extended*, with convincing continuity and no cartoon ecology. They are frustrated with repeated plans and unconvincing superficial fixes.

**Remove from the actual application:**
- The entire **Photographic study** field route/toggle and 2.5D orb experience; no photographic scene, layer pipeline, fake glass ball, or alternate scenic mode.
- All daisies, butterflies, fireflies, and any toy-looking field decorations. Do not replace them with different low-grade flowers, animals, billboards, sprites, or a new photographic background.
- Remove dead associated rendering, UI, CSS, scripts and CI asset download paths, not merely hide a still-running 3D scene.

**Preserve:**
- The original Zephyr-based, shader-driven **dense interactive grass** and its wind as the core asset; the actual new grass design must be based on this same shape/material/wind family.
- Sky, day/night and weather functionality (keep viable rain separately if the existing combined ecology module must be removed), audio toggle/controls, routes `#/`, `#/work`, `#/field`, editorial catalogue, SYS-001 published reader preview and existing 11 anonymous `?` placeholders; project preview **photography** is not the rejected *photographic meadow*.
- Sound functionality, default mute, work-view muffling, mobile navigation, full catalogue interactions.
- Wake/brush interaction unless a demonstrable improvement can be made without delaying primary seam work. It still sometimes reads as a carved trench; record as separate unresolved visual target rather than claiming it is solved.

## Verified code causes — inspect these exact files before editing

1. `patches/overlay/LiveLandscape.tsx`: mounts `<MeadowWorld/><GrassField/><WindSystem/><MeadowEcology/>`, and an entirely separate `<PhotographicMeadow/>` with `photoMode` state and special Canvas loop.
2. `patches/apply.py`: patches pinned upstream Zephyr `src/components/GrassField.tsx` at build time. The hero density is **400×400 = 160,000** blades on desktop, **220×220 = 48,400** on coarse pointer, and **112×112 = 12,544** in `?quality=low`. The original hero uses `grassGeometry(7,0.02,0.5,2.0)` and a bespoke shader + GPU wind/wake.
3. `patches/overlay/MeadowWorld.tsx`: has a **180×180** terrain with a separate `DistantGrass` renderer. The latter has only **16,500 outer blades desktop / 6,500 touch / 2,600 low**, uses **different** `grassGeometry(3,0.024,0.32,1.1)`, its **own** simpler wind and distinct colours. Instances are spread over radius approximately **4.8 to 67** world units, causing an extreme density and silhouette discontinuity next to the 10-unit hero field. It draws blue-green vertical streaks over exposed underlying terrain. Height uses `getHeight(x,-z)` (check sign conventions and world transformations while unifying).
4. `patches/overlay/MeadowEcology.tsx`: combined daisies, butterfly meshes, firefly points and rain segments. Remove decorative systems; extract **rain only** to a dedicated weather component if needed. No remaining flower/insect draw calls.
5. `patches/overlay/PhotographicMeadow.tsx`, `patches/overlay/PortfolioShell.tsx`, `patches/overlay/live.css`, `patches/apply.py`, `.github/workflows/pages.yml`, `patches/build-photo-depth.py`, browser tests, `PHOTO_SOURCES.md`: remove photo scene and obsolete controls/assets **without deleting the independent reader project preview or its licensed editorial image**. Remove photo generation/download/Python extras from CI; do not accidentally strip `reader-editorial.jpg` or SYS-001's ProjectSpotlight.
6. `patches/overlay/WakeField.ts` and the hero patch hooks in `patches/apply.py`: local field deformation presently creates visible paths. Inspect preservation, but unify meadow rendering first.

The source is compiled from a pinned upstream Zephyr revision; make changes in **versioned overlay + patches**, not an untracked ephemeral `zephyr/` build folder. Preserve attribution/licences.

## Engineering implementation — not another exterior skin

**First make the core grass itself continuous:**
1. Inspect upstream `GrassField.tsx`, grass geometry, shader materials, world height and instancing; identify its actual patch dimensions, placement distribution, affected axis/UV assumptions, shader uniforms and wind field.
2. Produce a single **shared grass visual language** across spatial LODs: same blade silhouette family (7-segment curved leaf near/mid as budget permits), matching base/tip colours, alpha/shading, height/scatter distributions, terrain attachment and temporal wind field. Separate distant mesh must not have obviously different width/colour or be reduced to blue sticks.
3. **Extend the high-quality patch materially beyond current roughly 10×10**, ideally through **world-aligned, bounded instanced chunks** or tapered ring bands rather than scaling individual blades or multiplying full 160k everywhere. Preserve true screen-space density for all visible foreground. Do not change geometry size to mimic density. Derive mid-range from the same shared shader/geometry/material defaults.
4. Use overlapped / blue-noise-jittered near→mid density, stochastic thinning and per-instance colour/height variation so transition positions cannot be read as a ring. Keep random seeds stable in *world coordinates*. Ensure wind direction, wave phases and weather tint evolve coherently across chunks. No cliff in saturation or height.
5. At genuinely far distances only, use low-cost **matching** meadow clumps/geometry or terrain-backed colour/noise detail with proper atmospheric perspective. Match perceived meadow mass, not literal blade count. The horizon should form natural terrain contours without exposed artificial green plane or linear streaks.
6. Keep proper camera limits in `LiveLandscape.tsx`; do not simply hide the boundary behind a restricted viewpoint if the field still fails at other currently allowed orbits. Preserve tasteful blue daytime sky and landing typography contrast.
7. Keep audio, normal orbit and grass interaction working while this geometry changes. Wind must not reset per tile or animate as independent asynchronous squares. Use a shared global time/wind function, not per-tile time. Do not let source patch restructuring break wake UV or root anchoring; if wake covers only central area, that limitation must be explicit or expanded correctly.
8. Performance budgeting should be grounded in **screen coverage**, not uniform world-unit density. Test desktop default and `?quality=low` separately; a 160k-to-millions unbounded instance expansion that locks Safari is unacceptable. Prefer chunking, instancing, frustum culling, screen-space LOD, and optional adaptive device budgets. Distinguish measured FPS from estimates.

**What not to do:** add more flower assets; introduce unrelated photo/AI picture processing; mask the seam with opaque fog or a hill; merely change foreground colour; pass a unit test but fail the screenshot; rebuild the entire portfolio design; create an empty new game; claim visual realism from a green build.

## Acceptance gates — visually decisive

- At **1440×900 desktop** in daylight, default camera, valid low/high orbit and zoom positions: **no visible border, lush-to-bald discontinuity, exposed blue "twigs", or rectangle/circle of premium grass**. The middle field must appear materially like the dense foreground. Compare user screenshot from 22 Nov with new screenshots *at matching camera angles*.
- At **390×844 mobile**: same landscape continuity, no excessive frame stalls, no UI regressions; preserve natural touch camera behavior.
- Verify dusk/night/rain still look unified and horizon still reads as part of the same place.
- No daisies, butterflies, fireflies, fake sphere, "Photographic study" UI or associated asset requests in browser or deployed app. Rain and cloud/weather settings remain functional.
- `#/`, `#/work`, `#/field` navigation, catalogue filtering, published SYS-001 hover/tap/visit, '?' placeholders, ambient sound, history/deep links and reduced-motion defaults continue to work.
- Original grass wakes and wind still work; no ghosted/circular distortion of sky. Separately document any remaining grass wake realism weakness; do not mark that defect solved unless observed.
- Full build + original tests + new geometry/LOD tests + **real Chromium desktop/mobile browser screenshots** + check JS console/WebGL shader logs. Inspect screenshot assets rather than just citing green CI. Real **Mac Safari full-density FPS and appearance remain unverified** until tested on user device, not inferred from software Chromium low-quality mode.
- Source code must be commit-reviewable, with before/after screenshots, actual tested commit SHA and documented limits. Deploy only after visual review and regression gates. Confirm the exact public Pages commit after merge. Restore prior live version on any significant regression.

## Proposed execution order for next chat

1. Load repo context router and applicable failure rules. Check latest `main` commit and this branch, rather than assuming this handoff's baseline is unchanged. Read the upstream GrassField and shaders. Run existing build/test to establish baseline.
2. Remove photographic field architecture and decorative ecology completely; preserve independent work-preview photo and legitimate weather. Re-run typecheck quickly.
3. Implement an enlarged shared grass field and seamless mid/far LOD derived from hero shader, not a cheap separate grass clone.
4. Capture and scrutinise midday seam screenshots at 1440×900, 390×844 and the exact user's orbit viewpoint. Iterate visual/geometry until no identifiable boundary remains; don't ship if still "bald".
5. Run regression tests for catalogue, routes, ambient audio, rain/daylight, grass wake and mobile. Note actual performance limits.
6. Create PR, merge only after visual gate, verify Pages deployed commit, update this document/release record with implemented facts, rejected approaches and screenshots.

**User instruction:** Treat this as implementation work. Execute autonomously, don't ask to repeat known requirements, don't stop at another plan or mockup, don't assume done because the CI passes, don't call it photorealistic. The goal is a *single, continuous, convincing meadow* using the grass already known to look good.

## Implementation checkpoint — 22 Nov 2026

The initial unified-band implementation built and passed landscape sampling/portfolio model tests, and software Chromium smoke journeys on 1440×900 desktop and 390×844 mobile, but **failed the visual acceptance gate**: photographed screenshots `desktop-meadow-default.png`, `desktop-meadow-low-orbit.png` and `mobile-meadow-default.png` showed exposed flat terrain and isolated dark blades after the high-density near field. No merge or deployment at this checkpoint. The unit LOD model alone cannot establish field continuity. Reported browser rAF intervals on headless SwiftShader (`?quality=low`) were ~483ms desktop median and ~2150ms mobile median, not actual Safari FPS.

Follow-up implementation adds GPU-instanced crossed clumps authored programmatically from tapered Zephyr-style grass leaf shapes. These supply foliage mass at mid/far range without increasing full-shader individual blade counts, while retaining full Zephyr geometry near/mid. The next screenshot review must assess actual perceptual benefit and whether this new LOD is still too artificial; no acceptance implied by this note.

### Rejected visual iteration — procedural crossed clump cards

PR #5 after commit `914eb2f2`: software Chromium tests passed, but screenshots `desktop-meadow-default.png` and `desktop-meadow-low-orbit.png` showed dark coarse shrub-like clumps over exposed turf. The same approach was therefore removed as visually invalid. Its pixel/quad density does not reproduce the original Zephyr silhouette. Current candidate restores a pure Zephyr blade-geometry density bridge and augments truly far terrain with fine procedural turf texture; **pending visual verification**. The canopy files must not remain in shipping build or active scene.

### Visual checkpoint — 22 November 2026, commit e142d873

Fourth-band density bridge with original 7-/5-segment grass and fine terrain microtexture passes the real Chromium desktop and mobile journeys (GitHub Actions run [44972447772](https://github.com/ianyhz37491-cloud/publishes/actions/runs/44972447772), 1440×900 desktop and 390×844 mobile). I inspected `desktop-daylight.png`, `desktop-meadow-default.png`, `desktop-meadow-low-orbit.png`, `mobile-meadow-default.png` and the previous main baseline equivalent. They show a material reduction in the naked green plain and removal of dark shrub cards; blades now extend visually into the middle distance, with a more naturally textured distant canopy. The previous over-large second camera drag threw the camera into near grass and produced an invalid `desktop-meadow-high-orbit.png` image; the browser QA script has been corrected to use moderate, independent orbit drags and a camera reset, pending a fresh screenshot check.

The test used `?quality=low` with headless SwiftShader. Desktop median rAF interval ~500ms; mobile sampled interval from ~16.7ms to ~2033ms; samples are insufficient to report stable FPS. This software-renderer performance is poor; no claim of real iPhone or Mac Safari responsiveness or full desktop LOD profiling is made. The brush/wake is still central-field-only and its trench-like appearance is unresolved. This is a screenshot-based *visual improvement* record, not a complete real-device certification.
