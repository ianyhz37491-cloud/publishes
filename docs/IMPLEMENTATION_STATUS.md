# Interactive portfolio — implementation status
**Updated:** 21 November 2026 (Australia/Sydney)  
**Review branch:** `feature/interactive-portfolio`  
**Pull request:** https://github.com/ianyhz37491-cloud/publishes/pull/1

## Product scope

The intended deliverable is a functional, navigable portfolio interface extending the *existing* Serenity/Zephyr landscape, not a new engine or fabricated case studies.

Current implemented code:
- A centred italic landing and title/chevron, wheel, swipe and keyboard entry.
- Responsive editorial catalogue with 12 explicitly unpublished slots, stable SYS/EXP/RES/VIS codes and working category filters.
- Hash routes (`#/`, `#/work`, `#/field`), browser history, deep links and route focus changes.
- Single persistent R3F canvas, fallback poster if WebGL2 is unavailable, opt-in ambient audio staying mounted.
- Optional full-screen field with collapsible controls: sun mood, cycle duration, pause/resume, wind, ambient sound, volume, reset camera and return.
- World-aligned directionally stamped CPU DataTexture fed into the original grass vertex shader, overlaying existing wind. The old single spherical cursor force is removed.
- Source-backed Zephyr licence and pinned CC0 recordings preserved.

## Evidence, not assumptions

**Independently verified on the branch at commit `2304b6158c34a750d6ff2c908c91e8ecb0cd85ff`:**
- [GitHub Actions workflow 44887478451](https://github.com/ianyhz37491-cloud/publishes/actions/runs/44887478451) completed with success.
- Actual upstream Zephyr source patch applied cleanly; TypeScript compile and Vite production build succeeded.
- Existing four-stage cycle timing and crossfade tests passed.
- New data provenance, filtering, hash-route and wake field model tests passed.
- Desktop (1440×900) and touch mobile (390×844) Chromium flows passed, including actual WebGL2 free roam, changing lighting to Night, and returning to work. The browser suite exercised an explicit low-density `?quality=low` rendering mode and preserved [CI screenshots](https://github.com/ianyhz37491-cloud/publishes/actions/runs/44887478451).
- The original public Pages site was not replaced during review.

**Further code revisions following that passing run:** direct mood label syncing, enhanced night grass visibility, README documentation. These changes require a subsequent CI pass and screenshot comparison before merging. Do not infer verification of those later changes from the earlier green run.

## Outstanding release checks

1. Verify the latest commit passes the entire CI workflow and inspect a new field-at-night screenshot. The earlier screenshot revealed night grass was near-black.
2. Review full-density grass fidelity and directional wake in a real hardware-accelerated Safari/Chrome session. CPU-generated wake continuity is unit-tested, but *perceived* wind/brush realism is not established by a unit test.
3. Check audio levels and abrupt onset on physical speakers, especially Safari's gesture requirement. Git-blob integrity is verified, listening quality is not.
4. Measure animation/frame rate on Apple Silicon and a mobile device. CI uses 56² blades, versus production defaults of 160k desktop / 78.4k touch.
5. If CI and release blockers are resolved, merge the reviewed branch, verify the exact production commit and check deployed browser workflows—not merely HTTP 200.

## Integrity boundaries

No actual project descriptions, private journal records, brand graphics or fictitious demo links have been published. The catalogue records are placeholders, not evidence of work already completed. Museum, train station and separate 3D gallery concepts remain future directions, outside this bounded release.
