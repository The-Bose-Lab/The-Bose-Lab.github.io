# Bose Lab website

Production implementation of the approved Axiom Sans design. Static HTML pages are generated from `_data/*.yml`; Vite bundles only the JavaScript needed by each route. No server, database, framework runtime, or external font/CDN dependency is required.

## Local development

Use Node.js 24 and pnpm 11:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm build
pnpm preview
```

The generated site is in `dist/`. To mount under a path, build with `SITE_BASE=/preview/ pnpm build`. Pull requests are checked without publishing. Merging to `main` runs the production checks, builds with `SITE_BASE=/`, verifies the article route and assets, and publishes `dist/` through GitHub Pages Actions. The `github-pages` environment limits deployment to the production branch.

## Editing

- `_data/`: people, papers, research text, news, and joining information.
- `content/normalizing-flow-maps.html`: original article content, preserved verbatim.
- `src/site/site-components.js`: static page markup; `scripts/generate.mjs`: route generation.
- `src/site/palette.js`: approved shared colours.
- `src/site/selection.js`: visit-level random selection, stable through resizing.
- `src/site/`: scientific models, rendering, opening/memo transition, and interactions.
- `src/responsive.css`: compact-screen navigation and composition.
- `public/`: self-hosted assets, font, molecular coordinates, Molstar, and KaTeX.

Main visuals sample uniformly from two proteins, one crystal, sphere, torus, evolving energy landscape, annealed density canopy, and conditional ribbons. Loaders independently sample three proteins and three generative examples. Research details sample the approved structures separately. Ribbons retain their original motion and 11.424-second period; other scientific animations retain the approved 1.5× clock. Reduced-motion preferences and offscreen/background suspension are respected.

Molecular coordinates and the article assets retain their source provenance. The original article GIFs are kept in `content/media-originals/` but are excluded from the published build. Their WebP derivatives have identical decoded RGBA frames, durations, loops, and dimensions. Optional regeneration requires Pillow with animated WebP support:

```sh
python3 scripts/optimize-media.py
```

`tests/fixtures/approved-geometry.json` records representative geometry and particle samples from approved design commit `520e4a601ae7248ca7a1d6314a512017d6cb0c0f`. Checks validate those samples, ribbon timing, curation, all routes, and local asset links at both root and preview paths.

## Rendering and loading

Scientific canvases share one renderer and retain their outline targets. GPU bitmap presentation is used when supported, with the original canvas-copy fallback. Animated canvases target 60 fps. Molecular views use spatial supersampling at a minimum of three drawing pixels per displayed pixel, with SMAA instead of temporal accumulation to keep moving structures sharp. The carried molecular view retains one drawing surface in both intro frames and throughout the move; camera framing changes the displayed footprint without clearing the buffer. Rotation uses a frozen phase during the move and blends across the complete transition.

The landscape caches its time-independent spatial kernels. Static sampling conformers are drawn once and positioned with the changing manifold. Phone layouts trim unused camera headroom against a fixed surface-and-attachment envelope computed before any model loads. Selection never changes the atlas inset. Settled memo text/layout is not recomputed every frame. Both intro frames are prepared before gestures become available; molecular stages stay hidden until their camera is fitted. The memo shares the News content rail; its measured bounds set a bounded header gap and the following News position. The home rail expands on wide desktops. Height-only phone-toolbar changes preserve the intro viewport and anchor positions, while desktop window resizing refits the composition. Gesture capture precedes embedded viewer handlers, and display-only molecular views do not receive pointer input. Once an anchor settles, an uninterrupted wheel stream returns to native scrolling. The pinned overflow viewport permits scroll chaining to the page; disabling that chaining traps stationary-pointer input.

Loading widgets use the shared scientific renderer, including lightweight ribbons derived from deposited protein backbones; they do not load Molstar. The opening construction lasts at least 650 ms. Route changes paint an opaque veil before navigation; fast text pages do not import a widget or wait for its animation. Pages still loading after 250 ms get a widget with a 500 ms construction and fading exit.

For local diagnostics, `?profile=1` exposes sampled rendering FPS and submission time in `document.documentElement.dataset.renderProfile`. `?profile=copy` exercises the compatibility presentation path. These are browser measurements, not a promise of identical FPS on every device.

## Preview and publication

The review build is mounted at `/preview/` on the design-review host. The production build publishes at `https://the-bose-lab.github.io/`; the NFM post keeps `/normalizing-flow-maps/`. The previous Jekyll page addresses redirect to the corresponding new pages. No application-intake backend has been added; the group review pipeline is still to be agreed.


The NFM article's 77 equations are rendered by the pinned KaTeX copy during generation. The browser loads only its font stylesheet. The two long molecular loops use muted inline H.264, load within 350px of the figure, and pause outside the viewport. Their original WebP files remain as no-JavaScript fallbacks. `scripts/optimize-article-video.py` regenerates the videos and verifies every decoded frame, dimensions and timing (local Python dependencies: Pillow and imageio-ffmpeg); the report is in `tests/fixtures/article-video-report.json`.

Home starts its molecular runtime and known companion data requests in the document head, shares metadata requests and prepares companion renderers concurrently. Molecular coordinates, deformation, palette, camera framing and render sampling are unchanged.

The canonical NFM article route is `/normalizing-flow-maps/`; the earlier `/blog/normalizing-flow-maps/` route remains available. Both preserve figure and equation fragments. The publication molecule marker supplies the SVG favicon, ICO fallback and Apple touch icon.
