# Interactive Portfolio — Implementation Handover
**Status:** approved planning brief; implementation NOT started.
**Prepared:** 21 November 2026 (Australia/Sydney).
**Current source:** https://github.com/ianyhz37491-cloud/publishes
**Current live Serenity scene:** https://ianyhz37491-cloud.github.io/publishes/
**Verified existing source HEAD at planning time:** ad9c178554020dfde5043f812059968b99c77aa7
**Last verified workflow:** https://github.com/ianyhz37491-cloud/publishes/actions/runs/44883739229 (build, deploy and public HTML checks successful; NOT Safari visual/audio certification).

## Product objective
Build a distinctive interactive portfolio for visitors, prospective collaborators and employers. The environmental layer is Serenity (an independently animated rolling grassland). The functional layer is an instantly comprehensible, Yeezy-like editorial catalogue of projects. The environment is an asset, but discovering the work must never require solving a game.

The user supplied three visual references in the planning conversation:
1. Existing Safari screenshot of Serenity close to the ground: rolling dense grass and sky; preserve view and calm movement.
2. Yeezy clothes catalogue screenshot: enormous clean spacing, multi-column catalogue, tiny category controls, understated monospaced product identifiers; copy hierarchy and browse behaviour, NOT brand assets.
3. Instagram profile screenshot "kail.designs": portfolio/inspiration curator with posts about remarkable portfolios, type and design resources. Treat as a research lead; the image itself does not establish how the featured third-party portfolios work.

User journal idea: collect exemplary original interactive portfolios, including a simulated train station or art gallery. Combine high-impact creativity with accessibility to users/employers. Use mythological naming as an optional memorable layer, and stable Yeezy-style serial identifiers for navigation.

## What is already implemented and what is not
The current repository serves an adapted Zephyr 3D grassland. The root build uses React, React Three Fiber, Drei, Three.js, Vite, TypeScript and custom GLSL. It is built by GitHub Actions from pinned Zephyr commit bd74c81efa0c49a8f8acc6cab41550dd2f0d95b0 (MIT), then overlays project-specific files with patches/apply.py.

Relevant existing source:
- patches/overlay/LiveLandscape.tsx: single canvas, existing Serenity heading, small mood control, audio toggle and camera controls.
- patches/overlay/SerenityAtmosphere.tsx: equal 4-stage cycle, moonlit night and clouds.
- patches/overlay/serenityCycle.ts: pure mood timing logic; tests in tests/test-serenity.cjs.
- patches/overlay/SerenitySound.tsx: opt-in, crossfaded CC0 field recordings.
- patches/overlay/live.css: current controls and full-screen layout; currently makes body overflow hidden.
- patches/overlay/solar.ts: shared animation state.
- patches/apply.py: patches Zephyr grass fragment and vertex shaders and installs the overlay.
- .github/workflows/pages.yml: builds using --base /publishes/, tests timing and audio SHA, publishes and checks public HTML.
- AUDIO_SOURCES.md: sound provenance.

Current cursor interaction is visibly artificial: a single circular radial force, multiplied by smoothstep falloff in grass.vert. It is NOT a convincing brush trail and must be replaced.

Verified: CI production build, equal-mood test, license-origin file checks, static HTML deployment. NOT verified: GPU visuals or performance in Safari, audio plausibility on speakers, mobile scroll, design fidelity. The portfolio routes, grid, font system, trail and free-roam UI are NOT yet implemented.

## Reference research — borrow mechanics, do not clone content
- Peter Oravec (https://peteroravec.com/): Phaser-based navigable pixel-art portfolio layered under regular HTML interface; importantly includes a fast "no time to explore" route. Lesson: experimental world + direct access to work.
- Tomasz Szmajda, ITom (https://itomdev.com/ ; code https://github.com/ITomPoland/portfolio-itom): interactive sketch-textured 3D corridor. MIT code, but personal artwork/assets explicitly reserved. Lesson: authorship, surprise, spatial narrative, and conventional DOM for navigation. Do not import assets without permission.
- Bruno Simon (https://bruno-simon.com/): drivable 3D portfolio. Lesson: playful optional exploration and clear first interaction; don't impose driving controls on employers.
- Abigail Kamenetsky museum portfolio (https://github.com/abigailkamenetsky/museum-portfolio): walkable gallery with artworks revealing resume content. An implementation reference, NOT a new base project.
- Art-gallery creator breakdown by Taylor Ferran (https://dev.to/taylorferran/i-turned-my-portfolio-into-an-art-gallery-g57): notes that its prototype has no mobile controls and hides the best work at the rear. Avoid those usability faults.
- Instrument Serif (https://github.com/Instrument/instrument-serif): OFL-licensed editorial display serif; recommended italic hero typography, not a required exact font.

Do not build a train station, interactive museum, game map or new low-quality nature environment in this release. Keep them as future optional portfolio "exhibitions" after the primary catalogue works.

## Required three experience states
### A. Landing / Entry (default URL)
- Serenity occupies the full viewport at the established low-angle rolling-hills composition. No header/nav/counters/logo or current "Serenity — four moods" top-left text.
- Dead centre: a single large white italic line "interactive portfolio"; "enter" is much smaller, near/beneath the title. One minimalist floating downward chevron, resembling a rotated >. Nothing else competes for attention.
- Strong but restrained editorial display typography, e.g. Instrument Serif Italic with robust serif fallback. No generic gradient blobs, glowing circles, thick cards, intro loading theatre or marketing slogans.
- Hover/focus on the title: subtle animated tension (letter spacing, translate, perhaps variable italic or underline reveal), 200–400ms, no flashing. Pointer and keyboard activate the same interaction.
- Click/tap title or chevron, scroll downward / swipe upward, or press Enter/ArrowDown/PageDown to enter the project catalogue. Avoid aggressive wheel-event hijacking and accidental double triggers. Reduced-motion users get immediate state change.
- While loading the WebGL scene, the title and chevron MUST remain visible and operable on a quality poster/fallback. Intro must never block navigation.

### B. Work catalogue
- The landing view moves upward in one coherent reveal, using the same visual world underneath. Do not restart WebGL, audio or sky time across page states.
- Reference the user-supplied Yeezy screenshot for high whitespace, grid rhythm, skinny top controls and small caption codes. DESKTOP target: 5–6 columns when width permits; tablet about 3; phone 2, with responsive gutters and generous vertical breathing room.
- Background Serenity remains alive but recedes: apply measured dimming/desaturation and mild blur to the canvas (start around 5–8 px), plus adaptive transparent scrim for white-text contrast. Do not cover the whole screen with opaque or milky cards. Do not apply expensive full-viewport backdrop-filter indiscriminately; compare actual Safari GPU performance. "Liquid glass" is reserved for a tiny nav/control element if it performs well.
- Compact centered category navigation above grid (working labels: ALL, SYSTEMS, EXPERIMENTS, RESEARCH, VISUAL). No generic sidebar, fake metrics, decorative dashboard widgets.
- The requested current scope is a COMPLETE catalogue UI with intentionally empty project content. Create a typed, clearly marked placeholder data source (e.g. 12 empty preview slots) but do NOT fabricate names, achievements, thumbnails, descriptions, live status or links. A placeholder may display only a serial code and an intentionally empty image region. Disabled project slots should not look like broken links. The navigation and category filters should work on the prototype dataset, but no placeholder is represented as a published real project.
- When real content is authorised later, the same source schema should accept title, category, optional codename, stable code, brief, thumbnail, project detail, live link, repo, status, provenance and selected ordering. At that point project cards can open meaningful details; this is deliberately OUT OF SCOPE now.
- Grid items may respond to hover with a tiny lift/opacity/soft focus change; respect touch/keyboard equivalents. Avoid autoplay effects and visual clutter.
- Visitors who wish to look at projects should never be forced into free roam, 3D WASD controls or long intro sequences. Add a succinct accessible route to the catalogue, and ensure native back/forward navigation works.

### C. Free roam / Enter field
- Small, inconspicuous bottom-right or bottom-left text control, present in portfolio states without dominating landing. Keep user-described "free roam" / "enter field" language.
- Activating free roam hides project/navigation overlays and removes background blur. The original Serenity grassland returns at full quality, preserving camera where sensible and preserving playing audio.
- Provide elegant on-demand control panel in same type language (default COLLAPSED): sound toggle/volume, play/pause the solar progression, mood selector or manual scrub, cycle duration, wind calm/strong control, reset camera and "return to work". Do not show developer Leva panels in normal experience; optionally expose debug controls only through development switch. Sound remains opt-in.
- Exiting restores the former portfolio state and its scroll position. Escape and accessible back control work. If WebGL is unavailable, free-roam button reports unavailability and never opens an empty view.

## Grass interaction — replace the obvious radial sphere
The source currently uses one cursor centre, circular smoothstep and instantaneous direction away from the pointer, causing a visible orb. Implement a directional, spatially persistent grass interaction with a fading WAKE.

Recommended technical starting point:
- Map pointer ray to the existing terrain world XZ plane, respect terrain height and camera movement.
- Accumulate movement along the full swept cursor path, not isolated positions. Interpolate sample stamps so fast sweeps never leave dotted circles.
- Use a low-resolution, world-aligned interaction texture/field (e.g. 128–256 px per side) with an RG or RGBA directional influence and strength/history. Stamp anisotropic ovals/capsules aligned with travel direction, with softly broken-up edges from low-frequency noise, rather than expanding sphere particles.
- The grass vertex shader samples the wake and deflects tips with root anchoring, layered over its PRE-EXISTING Zephyr wind. No per-blade JS work. Slightly asynchronous recovery/variation so a track remains perceptible about 1–3s and naturally relaxes. Keep the wake low-strength; no visible hard borders, marching ripples or grass disappearing.
- Prefer whichever implementation maintains Safari FPS: bounded CPU-updated DataTexture or a GPU ping-pong field after profiling. Choose based on measurements rather than novelty.
- When cursor is over interactive DOM UI, over the sky, or on the catalogue, do not stamp the grass. On touch, avoid scroll stealing: only allow grass brush under an explicit exploration gesture/free roam.
- Keep cursor-driven rustle volume correlated to actual ground interaction speed/energy; avoid the previous false sudden loud burst on pointer entry. Manual user listening/visual review required.
- Do not add literal "footprints" unless an avatar or first-person walking mode exists: an elongated, fading disturbance suffices.

## Naming and identity system
Separate discoverability from distinctive brand names:
- Stable visible catalogue identifiers: SYS-001, EXP-001, RES-001, VIS-001 etc. Serial numbers never change when tiles are reordered; not invented real project labels in this initial blank catalogue.
- Optional mythological code names for ACTUAL projects later, e.g. Atlas (mapping), Iris (perception), Echo (sound), Daedalus (making). These are examples only, not assigned projects or new brand names yet. Check duplicates/trademarks where relevant.
- Keep human-readable actual project title and functional category alongside any mythological codename in future detail views. Employers must understand what it does without decoding a myth.
- Optional short index number style inspired by Yeezy garment IDs, but not fake product prices or checkout-style interactions.

## Interaction and architecture
- Preserve a single mounted Serenity Canvas and its WebGL resources across landing/catalogue/free-roam. Existing scene gets wrapped by a PortfolioShell, with DOM overlay for landing, catalogue and controls.
- The root currently uses LiveLandscape.tsx with React/TypeScript and Vite; continue from current overlays and teach patches/apply.py to copy any new files. Do NOT rewrite all of Zephyr or discard its sound, shaders, sun tests or licences.
- Suggest routes based on URL hash for GitHub Pages project hosting: #/ (landing), #/work (catalogue), #/field (free roam), or equivalent static-host-safe navigation. Deep links, back/forward and reload must work at /publishes/.
- Scroll downward should move entry to work; catalogue scrolling must remain natural and accessible. Free roam is a clear mode, not a hidden wheel trap. Keyboard, touch and trackpad all supported. Overlay hit-testing must not unintentionally orbit the camera.
- CSS state transitions first; add GSAP only if a measurable need justifies the dependency. Use real DOM text and controls for accessibility/SEO, not text drawn into WebGL.
- Headline uses local or permitted OFL Instrument Serif Italic; functional labels use clean neutral sans and small sparing monospace codes. Proper font licences must be retained.
- Suggested palette: white/near-white text over field, with dark transparent scrims for readability; avoid beige cards, heavy gradients, generic indigo UI and oversized empty hero text. The intentional intro is the justified exception to a task-first opening screen.
- Add reduced-motion path, focus outlines, semantic navigation, error/poster fallback, audio opt-in, respect hidden tab, proper dispose on leaving, and prevent accidental reload of audio on state changes.

## Performance and rights
- Existing scene uses 160k blades desktop, 78.4k on coarse-pointer devices and capped DPR. Establish baseline FPS and memory before adding wake texture and blur; no claim of performance from npm build alone.
- Work catalogue must remain navigable when WebGL fails, shader compile hangs, audio unsupported or reduced-motion preference set.
- Test on Safari macOS 16GB Apple Silicon, Chrome desktop, Safari iPhone and at least one mid-range mobile device. Targets to evaluate, not current claims: 50+ median FPS desktop, 30+ median mobile during field view, no major long-task stutter, reasonable mobile first usable text.
- Blur is optional aesthetic enhancement, never a reason to drop mobile frame rate substantially. Provide graded quality levels and static poster fallback.
- User screenshots (Serenity, Yeezy, Instagram curator) serve as references; do not copy protected brand graphics, private content or proprietary game assets. Original Zephyr MIT and audio CC0 provenance must remain intact. Keep private journal/project files out of this public repo.

## Required verification and end-to-end acceptance
1. Loading /publishes/ shows visible legible centered italic hero and down chevron over Serenity. No "Serenity — four moods" top-left UI. Layout is composed correctly at night and noon.
2. Title, chevron, wheel/trackpad, touch swipe and keyboard entry reach /work, with a coherent upward transition. Browser back/forward and deep link refresh function.
3. Catalogue desktop/tablet/mobile grid resembles the user-provided Yeezy reference in whitespace, rhythm and labels. Filters work and preserve category selection; placeholders are explicitly non-real and do not open fake details. Grid scroll is not hijacked.
4. Blur/scrim changes only scene emphasis, remains translucent, and leaves text legible in all four sky moods. Performance compared against same scene without blur.
5. Free roam enters and exits cleanly; same canvas/audio persists. Controls genuinely change sky duration/mood, pause, wind, sound and reset camera. Return restores previous state and scroll position.
6. Cursor sweeping through grass leaves a non-circular softly fading track, anchored and blended with Zephyr wind; path persists then recovers. Fast swipes, camera orbit, hover over UI, touch and no-hover tested.
7. Sound is muted by default, starts only by explicit gesture, remains natural across states, and loops without audible seams or sudden volume spikes; all existing licence notes preserved.
8. Playwright or browser automation tests actions, routes, controls, cancellation and errors; add deterministic unit tests for wake-field decay/stamping and navigation state. Existing serenityCycle timing and current GitHub Actions deploy checks must keep passing.
9. Capture and inspect real Safari and Chromium desktop/mobile screenshots in ALL THREE states; check focus, contrast and no console/WebGL errors. Build-success and HTTP 200 are necessary but not sufficient.
10. Commit source through GitHub; confirm new Pages run serves exact new commit and user-visible scenes. Record what is tested, unverified and corrected.

Applicable private quality standards, to be read before coding: orchestration/context-router/INDEX.md and CONTEXT_ROUTER.md; relevant FAILURE_REGISTRY rules F-001 (generic UI), F-002 (dead controls), F-003 (invented data), F-005 (regressions), F-009 (contrast), F-010 (unfinished delivery), F-014 (examples interpreted as intent). Do not publish these private records.

## Scope and build order
This is a bounded complete UI-and-interaction release, NOT a content release:
1. Inspect the current live repo/CI and baseline browser scene.
2. Establish portfolio shell with one persistent WebGL canvas and static project catalog schema.
3. Deliver and test landing + scroll/click transition.
4. Deliver and test translucent catalogue + responsive grid/navigation, with honestly labelled placeholder records.
5. Deliver and test free roam and controls; remove old Serenity UI from all portfolio views.
6. Implement trail deformation and test graphics + audio coupling and performance.
7. Polish the three views against supplied screenshots on Safari/mobile; fix regressions.
8. Publish, verify the actual live URLs + interactions, and report outstanding quality limitations.

Do not ask the user to repeat details given here. Use the provided visual references (ask only to reattach images if an independent new chat cannot access them and actual pixel fidelity requires it). Never promise a completed product from a passing build alone.
