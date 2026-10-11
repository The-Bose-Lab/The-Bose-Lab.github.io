# Bose Lab website

Source for **https://the-bose-lab.github.io** — the Bose Lab (Department of
Computing, Imperial College London). Built with Jekyll; GitHub Pages builds and
deploys it automatically on every push to `main`. There is no build step to run.

## Editing content — lab members start here

All content is data, not markup. You should rarely need to touch HTML.

| What | Where |
|---|---|
| Add yourself / update your entry | `_data/people.yml` (photo goes in `assets/images/`) |
| Add a paper | `_data/publications.yml` (figure goes in `assets/pubfigs/`, optional) |
| Post news | `_data/news.yml` (newest first) |
| Write a blog post | `_posts/YYYY-MM-DD-title.md` — see below |
| Lab info, research areas, join text | `_data/lab.yml`, `_data/research.yml`, `_data/join.yml` |

## Blog posts

Create `_posts/2026-01-31-my-post.md`:

```yaml
---
layout: post
title: My post title
author: Your Name
math: true   # only if you need LaTeX (KaTeX)
---
```

then write standard markdown. Code blocks get syntax highlighting; with
`math: true`, `$...$` and `$$...$$` render as LaTeX. Open a PR; it publishes
on merge.

## Previewing locally (optional)

```bash
gem install bundler && bundle install   # once
bundle exec jekyll serve                # http://localhost:4000
```

Pushing to `main` without previewing is fine for data-only edits — Pages
rebuilds in about a minute.
