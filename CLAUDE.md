# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static landing page for "Void Crypt" — a Portuguese-language digital solutions marketing site. Built with vanilla HTML, CSS, and JavaScript; no build tools, no dependencies, no frameworks.

## Running Locally

Open `index.html` directly in a browser, or use a local HTTP server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Architecture

Three files compose the entire site:

- **`index.html`** — Single-page markup with 8 sections: navbar, hero, features, about, testimonials, CTA, contact form, footer.
- **`styles.css`** — ~850 lines. CSS custom properties defined in `:root` drive the entire color system (primary `#6366f1` indigo, secondary `#ec4899` pink). Contains all animations (morph, float, pulse, fade), responsive breakpoints (968px / 768px / 480px), and layout (Grid + Flexbox).
- **`script.js`** — ~265 lines. Handles: sticky navbar scroll effect, mobile menu toggle, smooth anchor scrolling, Intersection Observer scroll animations, parallax on hero, contact form validation + toast notifications, active nav link highlighting.

## Key Design Decisions

- **No build step.** All files are deployed as-is to static hosting.
- **CSS variables** in `:root` are the single source of truth for colors, gradients, and shadows — change there to retheme the entire site.
- **Toast notifications** are created dynamically by `script.js` (not in HTML) using a fixed-position div injected into `document.body`.
- **Form handling** is client-side only — the contact form has no backend; submissions show a toast and reset the form.
