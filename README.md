# Publishes — Zephyr Living Landscape

This public repository deploys a browser-based, interactive grass landscape adapted from [Zephyr by rether](https://github.com/RetherSzu/zephyr).

**Website (once GitHub Pages is enabled):** https://ianyhz37491-cloud.github.io/publishes/

## Design
- Close-to-ground rolling grass hills; coherent wind and cursor-responsive blades.
- More natural grass colour variation; independent 10-second day/night cycle.
- Sunlight, drifting clouds, stars, optional ambient sound.
- GPU-instanced rendering, adaptive display resolution and reduced-motion considerations.

## How it deploys
Pushes to `main` run [the Pages workflow](.github/workflows/pages.yml). The workflow checks out a **pinned upstream Zephyr commit**, applies the maintained landscape patch, checks compatibility, builds the static website with the correct `/publishes/` base path, and deploys to GitHub Pages.

This public repo keeps the [MIT-licensed original](https://github.com/RetherSzu/zephyr/blob/main/LICENSE) credited and unmodified in its upstream checkout. The change overlay is in `landscape-patch.tar.gz`; this is an interim source package from the prior Zephyr landscape development handoff. The generated website retains the MIT license notice in its build. Future edits should modify the source overlay and workflow, not upload different manually built site ZIPs.

**Publishing first-time setup:** Repository Settings → Pages → Build and deployment → Source: **GitHub Actions**. This may be required once before the deployment succeeds.

## Status and checks
The previous local patch passed syntactic / simulated patch compatibility checks. Full GitHub Actions build, WebGL shader compilation, Safari FPS, audio and visual QA require actual execution. A GitHub Actions success only confirms the build and hosting; it does not prove the visual experience meets quality requirements.

## Attribution
Original Zephyr source © 2026 rether, MIT License. See upstream license included in the deployed site under `/licenses/zephyr-MIT.txt`. Third-party Three.js, React, Drei and other dependencies retain their respective licenses. No private user files or repository histories are published.
