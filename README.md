# Serenity

A quiet, interactive grassland built as a future vignette for an interactive portfolio.

**[Open Serenity](https://ianyhz37491-cloud.github.io/publishes/)** · [Build and deployment](.github/workflows/pages.yml) · [Sound sources](AUDIO_SOURCES.md)

The scene is based on [Zephyr by rether](https://github.com/RetherSzu/zephyr) (MIT). It preserves Zephyr's instanced grass geometry and continuous wind-field shader rather than replacing them with abstract shapes or a bespoke nature engine.

## Experience

- **Four equal moods:** sunrise, daylight, sunset and night each occupy exactly one quarter of the cycle. The full cycle defaults to 10 seconds; easing, sun direction, lighting and ambience cross phase boundaries continuously.
- **Pastoral styling:** close-to-ground rolling grass, restrained colour variation, slow gentle breeze and independently drifting clouds. The night landscape stays visible in cool blue light rather than going black.
- **Interaction:** moving the cursor across the actual grass terrain gently pushes blades aside. A pause control freezes the solar progression but not the wind, clouds or nature sounds.
- **Sound:** user-enabled, crossfaded CC0 field recordings of rustling vegetation, meadow insects, morning birds and nocturnal crickets. Cursor contact increases the field-rustle layer. No synthesized hiss or autoplay.
- **Performance:** one GPU-instanced grass field; 160,000 blades on desktop, 78,400 on coarse-pointer devices, with capped device pixel ratio. No external landscape assets are required to render.

The user-supplied nature wallpaper is a visual mood reference, not a source asset. Preserve the airy composition, warm light and tranquil movement without copying copyrighted artwork or introducing distracting, low-quality procedural decoration.

## Repository

Pushes to `main` run [the Pages workflow](.github/workflows/pages.yml), which fetches upstream Zephyr at pinned commit `bd74c81efa0c49a8f8acc6cab41550dd2f0d95b0`, applies [the source patch](patches/apply.py), installs the [scene modules](patches/overlay), builds the public site and verifies that the deployed URL serves the application.

The two external audio repositories are also pinned by commit and each downloaded recording is checked against the known Git blob SHA before deployment. The provenance list is retained in the public website. The original [MIT licence](https://github.com/RetherSzu/zephyr/blob/main/LICENSE) is preserved.

## Verification and remaining work

The workflow runs [an executable timing test](tests/test-serenity.cjs) for four equal stages, continuous lighting, visible night and ambience weight calculations. It checks TypeScript/Vite compilation, audio file integrity, and public Pages HTML. A passing build **does not prove** that WebGL renders beautifully in Safari, that actual FPS meets a target, or that the audio mix is sonically convincing.

Before integrating it into a larger portfolio, evaluate the rendered night, sunrise colours, cloud silhouettes, pointer/drag interaction, seamless audio loops and Mac Safari/mobile performance. Mount the scene lazily when the Serenity feature is opened; dispose of its WebGL and audio resources when leaving. Keep sound opt-in. Avoid loading the full 3D scene on the portfolio homepage.

This repo is public and contains no private project records.
