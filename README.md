# Bose Lab website

Static website at https://the-bose-lab.github.io/. The NFM article keeps https://the-bose-lab.github.io/normalizing-flow-maps/; its original content is preserved in `content/normalizing-flow-maps.html`.

## Develop

Use Node.js 24 and pnpm 11:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Edit `_data/` for people, papers, research, news and contact information; `src/` for layout, interactions and visualisations; and `public/` for self-hosted assets. `scripts/generate.mjs` generates the routes and renders article equations at build time. The site has no application server or external font/CDN dependency.

Structure files in `public/assets/` are published as `.pdb.txt` / `.cif.txt` so that GitHub Pages serves them gzip-compressed (it sends `chemical/*` responses uncompressed, which quadruples the download), and the mmCIF hero is additionally stored as BinaryCIF (`.bcif`) for the Mol* viewer. After replacing a structure file, run `node scripts/molstar/encode-bcif.mjs` to refresh the `.bcif` copy.

`public/vendor/molstar.js` is a trimmed build of the pinned Mol* release: the standard viewer with only the MolViewSpec extension compiled in, which is all the site uses (about a quarter smaller than the stock bundle and faster to initialise). It is committed; rebuild it only when upgrading Mol*:

```sh
cd scripts/molstar
pnpm install --frozen-lockfile
pnpm build
```

## Publish

```sh
pnpm build
node scripts/publish-static.mjs
```

Commit both the source changes and the refreshed static files. GitHub Pages serves the repository root from `main`, with `.nojekyll`. `.published-files.json` tracks generated files so publishing removes outdated bundles safely. CI rebuilds the site and verifies that the committed output matches it.

The previous Jekyll page addresses redirect to their new routes. The article also remains accessible through `/blog/normalizing-flow-maps/`, including figure and equation anchors. To build a review copy under another path, use `SITE_BASE=/preview/ pnpm build`; publish that build separately.
