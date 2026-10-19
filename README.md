# Bose Lab website

Static website at https://the-bose-lab.github.io/. The NFM article keeps https://the-bose-lab.github.io/normalizing-flow-maps/; its original content is preserved in `content/normalizing-flow-maps.html`.

## Develop

Use Node.js 24 and pnpm 11:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Edit `_data/` for people, papers, research, news and contact information; `src/` for layout, interactions and visualisations; and `public/` for self-hosted assets. `scripts/generate.mjs` generates the routes and renders article equations at build time. The site has no application server or external font/CDN dependency.

## Publish

```sh
pnpm build
node scripts/publish-static.mjs
```

Commit both the source changes and the refreshed static files. GitHub Pages serves the repository root from `main`, with `.nojekyll`. `.published-files.json` tracks generated files so publishing removes outdated bundles safely. CI rebuilds the site and verifies that the committed output matches it.

The previous Jekyll page addresses redirect to their new routes. The article also remains accessible through `/blog/normalizing-flow-maps/`, including figure and equation anchors. To build a review copy under another path, use `SITE_BASE=/preview/ pnpm build`; publish that build separately.
