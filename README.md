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

The generated site is in `dist/`. To mount under a path, build with `SITE_BASE=/preview/ pnpm build`. The branch's workflow only checks and builds: it does not publish to GitHub Pages. The current live website remains on `main`.

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

## Preview and publication

The review build is mounted at `/preview/` on the existing design-review host. The original panel remains at `/opening-studies/`. Publishing the actual lab domain is a separate step after responsive review. No application-intake backend has been added; the group review pipeline is still to be agreed.
