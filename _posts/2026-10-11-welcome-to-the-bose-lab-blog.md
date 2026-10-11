---
layout: post
title: Welcome to the Bose Lab blog
author: Joey Bose
math: true
---

This is the lab's new home for technical writing — paper deep-dives, tutorials, negative results worth sharing, and the folklore that never fits in an eight-page paper. Every lab member is encouraged to write here.

## Writing a post

A post is one markdown file in `_posts/`, named `YYYY-MM-DD-your-title.md`, starting with front matter:

```yaml
---
layout: post
title: Your title here
author: Your Name
math: true   # only if you need LaTeX
---
```

Everything below the front matter is standard markdown. Code blocks are syntax-highlighted:

```python
def euler_step(x, t, dt, v):
    """One integration step along the learned vector field."""
    return x + dt * v(x, t)
```

And with `math: true` in the front matter, LaTeX renders via KaTeX — inline like $u_t(x)$ or displayed:

$$
\frac{\mathrm{d}}{\mathrm{d}t}\,\psi_t(x) = u_t\big(\psi_t(x)\big), \qquad \psi_0(x) = x.
$$

Open a pull request with your post, and it publishes when merged. That's the whole pipeline.

## What to expect here

To start, we're planning posts on the foundations the lab works on — flow matching from first principles, what flow maps actually buy you at inference time, and how Boltzmann generators earn (or don't earn) their equilibrium samples. If you're a student in the lab: your first post is a rite of passage. Pick the thing you most recently had to explain twice at a whiteboard.
