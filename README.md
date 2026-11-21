# Interactive portfolio / Serenity

An editorial portfolio built around a living grassland. The landscape creates atmosphere; the work index remains directly accessible without playing a game.

**[Open the portfolio](https://ianyhz37491-cloud.github.io/publishes/)** · [CI / Pages deployment](.github/workflows/pages.yml) · [Sound and licence sources](AUDIO_SOURCES.md) · [Implementation status](docs/IMPLEMENTATION_STATUS.md)

## Three routes

- `#/` — centred italic **interactive portfolio** entry over the landscape. Click or tap the title/chevron, scroll down, swipe up, or use Enter/ArrowDown/PageDown to enter.
- `#/work` — Yeezy-inspired editorial project index with responsive columns and working filters: ALL, SYSTEMS, EXPERIMENTS, RESEARCH and VISUAL.
- `#/field` — interactive grassland, with collapsible controls for environmental sound/volume, sunlight mood, lighting pause, cycle duration, wind strength, reset camera and return to work.

These are hash routes so deep links, refresh and browser history work on GitHub Pages' static project path. The three states share **one persistent React Three Fiber Canvas** and a persistent ambient-audio component; opening a catalogue or returning from the field does not rebuild the environment.

**Catalogue contents are intentionally not published yet.** The 12 prototype slots are clearly identified as unpublished. Their stable serial codes are not references to actual work. The typed [catalogue model](patches/overlay/projectCatalog.ts) is ready for later verified titles, images, descriptions, provenance and links, but none are invented here.

## Landscape

The scene extends [Zephyr by rether](https://github.com/RetherSzu/zephyr) (MIT, pinned at `bd74c81efa0c49a8f8acc6cab41550dd2f0d95b0`). It preserves Zephyr's original instanced grass, shader wind, terrain and project licence. The shader colours, four-stage lighting cycle, independent clouds and opted-in CC0 ambient recordings are maintained.

Cursor strokes in free roam now paint a small world-aligned **directional wake texture**. Its deflection flows along the entire sweep, decays smoothly and leaves each blade root anchored. The wake is composited with the original GPU wind—not a spherical cursor force or per-blade JavaScript animation. Pointer movement over the sky or catalogue cannot create grass strokes.

Typical scene density is 160,000 blades on desktop and 78,400 on coarse-pointer devices. The optional `?quality=low` query parameter deliberately reduces the scene to 56² blades for constrained rendering environments. It is used for browser integration QA; it is not evidence that full-density rendering meets a particular FPS target. An HTML/CSS scene poster keeps entry and the catalogue usable when WebGL2 is unavailable.

The original audio sources remain integrity-checked by Git blobs in CI, have their provenance preserved publicly, and never autoplay.

## Source and verification

The repository [patches the pinned upstream source](patches/apply.py) at build time with the [portfolio overlay](patches/overlay). No second 3D engine was introduced.

Every proposed release must pass:

- Original Serenity model tests: four equal-length lighting moods and continuous transitions.
- [Portfolio model tests](tests/test-portfolio.cjs): catalogue provenance, category filters, static routes, wake continuity/locality/decay.
- [Desktop/mobile browser checks](tests/test-portfolio-browser.cjs): real landing interaction, filtering, deep-link refresh, history, free-roam control actions and screenshots on a reduced-density WebGL scene.
- TypeScript/Vite production build, the audio file SHA checks and post-deployment Pages HTML checks.

A green CI run does **not** certify exact full-quality Safari/macOS/iPhone visual fidelity, measured frame rate, physical-audio quality or the subjective realism of the wake. These require direct hardware review. The latest evidence and unresolved checks are in [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).

No private notes or unpublished actual project details are stored in this public repository.
