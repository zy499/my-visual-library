---
name: cosmos-editorial-curation
title: Cosmos 暖纸画廊策展风 · Cosmos Editorial Curation
description: Image-led editorial curation UI inspired by Cosmos.so — warm archival paper canvas (#F7F4ED), contextual true-black stages (#000000), tight-tracked neo-grotesque headlines (-0.04em), 56px monochrome pills, and zero loud brand accent color.
colors:
  canvas: "#F7F4ED"
  canvasAlt: "#F7F5F3"
  surface: "#FFFFFF"
  border: "#DDD6CB"
  borderSubtle: "#E2E2E2"
  inkPrimary: "#0D0D0D"
  inkMuted: "#6E6962"
  darkStage: "#000000"
  darkInk: "#F7F4ED"
typography:
  display: "Cosmos Oracle, Neue Haas Grotesk, Inter, -apple-system, sans-serif"
  body: "Neue Haas Grotesk, Inter, -apple-system, sans-serif"
  h1: "72px / 700 / 1.0 / -0.04em"
  h2: "48px / 500 / 1.0 / -0.04em"
  h3: "26px / 500 / 1.15 / -0.02em"
  bodySize: "16px / 400 / 1.4"
rounded:
  card: "16px"
  pill: "9999px"
spacing:
  containerMax: "967px"
  sectionGap: "128px"
  gridGap: "24px"
motion:
  easing: "cubic-bezier(0.22, 1, 0.36, 1)"
  hoverMs: 220
---

# Cosmos Editorial Curation (`cosmos-editorial-curation`)

## 1. Visual Theme & Atmosphere
An ultra-calm, art-director-grade visual archive interface modeled on Cosmos.so. UI chrome recedes into warm archival paper (`#F7F4ED`) and near-black ink (`#0D0D0D`), intentionally eliminating loud SaaS brand colors so curated photography, typography specimens, and floating media collages provide 100% of the chromatic voltage. High-contrast transitions into pure-black (`#000000`) gallery stages heighten focus on full-bleed imagery.

## 2. Color System & Roles
- **Canvas Base**: `#F7F4ED` (warm editorial paper; alternate `#F7F5F3`)
- **Card / Panel Surface**: `#FFFFFF` with `1px solid #DDD6CB` (or `#E2E2E2`) hairline divider
- **Primary Ink & Primary Pill Fill**: `#0D0D0D` (near-black, crisp contrast without harsh glare)
- **Muted Ink / Captions / Quiet Links**: `#6E6962` (warm stone gray; secondary `#9A9796`)
- **Contextual Dark Stage / Lightbox / Footer**: `#000000` background paired with `#F7F4ED` ink
- **Accent Policy**: Zero permanent saturated brand accent; semantic or category tints derive dynamically from content clusters (muted slate blue, dusty rose, soft olive).

## 3. Layout & Structural Rhythm
- **Editorial Spine**: Primary narrative column capped around `967px`, centered with generous side margins.
- **Vertical Breathing Room**: `128px` between major narrative sections so headlines and floating imagery never feel crowded.
- **Loose Masonry & Drift Grid**: `24px` gutters across fluid image clusters; imagery preserves native aspect ratios rather than forcing uniform 16:9 crops.
- **Contextual Stage Flip**: Light warm-paper storytelling sections transition cleanly into full-bleed `#000000` dark gallery stages for interactive exploration.

## 4. Component & Interaction Specs
- **Primary CTA Pills**: Full-pill `border-radius: 9999px`, `height: 56px`, horizontal padding `28px–32px`, `#0D0D0D` fill with `#F7F4ED` text; secondary pills use `1px solid #DDD6CB` outline on `#FFFFFF`.
- **Media Tiles / Cluster Cards**: `border-radius: 16px`, ultra-soft diffused shadow (`0 12px 32px rgba(13, 13, 13, 0.06)`) only on floating hero thumbnails; flat borderless framing inside masonry walls.
- **Iconography**: Clean rounded-stroke outline icons (Phosphor Regular style, `1.5px` stroke) matching pill geometry.
- **Typography Discipline**: Display H1 `72px / 700 / line-height 1.0 / letter-spacing -0.04em`; H2 `48px / 500 / 1.0 / -0.04em`; H3 `26px / 500 / 1.15`; Body `16px / 400 / 1.4`.

## 5. Motion & Accessibility / Anti-Patterns
- **Motion Physics**: Restrained exponential ease-out (`cubic-bezier(0.22, 1, 0.36, 1)`), subtle `220ms` opacity/scale hover reveals (`scale(1.015)` on media tiles), and smooth lightbox zoom; full `prefers-reduced-motion` opacity-only fallback.
- **Anti-Patterns (Avoid / Do Not)**:
  1. Do NOT introduce saturated neon gradients, purple AI glows, or competing brand accent buttons.
  2. Do NOT wrap every masonry image in heavy drop-shadow dashboard cards with thick metadata footers.
  3. Do NOT use loose default tracking on large display headings or squeeze section spacing below `64px`.
  4. Do NOT use clinical pure `#FFFFFF` as the whole-page background when warm paper `#F7F4ED` establishes the editorial mood.
