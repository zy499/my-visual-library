---
name: zed-engineering-blueprint
title: Zed 工程蓝图极简风 · Zed Engineering Blueprint
description: Precision engineering-blueprint developer UI modeled on Zed.dev — cool slate paper (#dce0e5), pure white surfaces (#ffffff), 1px hairlines (#e5e7eb), brand blue (#74ade8) & syntax teal (#6eb4bf), IBM Plex Serif + Mono pairing, and ultra-tight 0–6px radii.
colors:
  paper: "#dce0e5"
  paperAlt: "#dadde2"
  surface: "#ffffff"
  hairline: "#e5e7eb"
  canvasDark: "#101828"
  inkPrimary: "#121316"
  inkBody: "#4e5a5f"
  inkMuted: "#6a7282"
  brandBlue: "#74ade8"
  brandBlueAlt: "#73ade9"
  syntaxTeal: "#6eb4bf"
typography:
  display: "IBM Plex Serif, Georgia, serif"
  uiSans: "Zed Sans, IBM Plex Sans, -apple-system, sans-serif"
  mono: "IBM Plex Mono, Zed Mono, monospace"
  h1: "52px / 500 / 1.08 / -0.025em"
  h2: "34px / 500 / 1.18 / -0.02em"
  bodySize: "16px / 400 / 1.55"
  codeSize: "15px / 400 / 1.5"
rounded:
  none: "0px"
  sm: "2px"
  md: "4px"
  lg: "6px"
spacing:
  containerMax: "1120px"
  sectionGap: "88px"
  gridGap: "16px"
motion:
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
  hoverMs: 120
---

# Zed Engineering Blueprint (`zed-engineering-blueprint`)

## 1. Visual Theme & Atmosphere
An architectural, GPUI-inspired developer-tools aesthetic modeled on Zed.dev. Instead of dark-mode neon gradients or pill-heavy consumer SaaS softness, the interface behaves like a precision engineering drafting table: cool mineral-slate paper, razor-sharp 1px structural hairlines, authoritative `IBM Plex Serif` headings paired with crisp monospace code wells, and deliberate 0–6px corner geometry.

## 2. Color System & Roles
- **Slate Paper & Surfaces**: Cool blueprint paper `#dce0e5` (alt `#dadde2`) frames crisp `#ffffff` panel surfaces separated by `1px solid #e5e7eb` hairlines.
- **Inks**: Deep ink `#121316` for display and active labels, slate `#4e5a5f` for readable technical prose, and `#6a7282` for metadata and shortcuts.
- **Dark Code Stage**: `#101828` anchors editor mockups, terminal outputs, and syntax showcase panels.
- **Restrained Chromatic Signals**: Brand blue `#74ade8` (`#73ade9`) for active indicators, links, and primary highlights; syntax teal `#6eb4bf` for technical accents and code tokens.

## 3. Layout & Structural Rhythm
- **Drafting-Table Grid**: `1120px` max container divided by visible `1px solid #e5e7eb` structural seams rather than floating card gaps.
- **Editorial × Technical Contrast**: Large serif statements anchor each chapter while dense monospace shortcut badges, benchmark tables, and live buffer previews deliver concrete proof.
- **Section Cadence**: `88px` vertical section separation with tight `16px` internal module gutters.

## 4. Component & Interaction Specs
- **Strict Border-Radius Scale**:
  - `0px` (`rounded.none`): Square-corner text inputs and grid table cells.
  - `2px` (`rounded.sm`): Dominant scale for keyboard-shortcut keycaps, inline tags, and compact chips.
  - `4px` (`rounded.md`): Standard buttons, feature cards, and code tabs.
  - `6px` (`rounded.lg`): Upper cap for large container frames and modal wrappers.
- **Typography Discipline**: `IBM Plex Serif` (weight 500) for display titles; `.ZedSans` / `IBM Plex Sans` (`16px`) for UI prose; `IBM Plex Mono` (`15px / 400`) with `tabular-nums` for code and benchmarks.

## 5. Motion & Accessibility / Anti-Patterns
- **Motion Physics**: Snappy `120ms` hardware-feeling transitions (`cubic-bezier(0.2, 0.8, 0.2, 1)`) reflecting sub-frame editor responsiveness; no bouncy spring overshoot or decorative scroll-jacking; respect `prefers-reduced-motion`.
- **Anti-Patterns (Avoid / Do Not)**:
  1. Do NOT use large `16px–24px` card radii or `9999px` pill buttons that dilute the engineered `0–6px` blueprint silhouette.
  2. Do NOT add blurry colored drop shadows or frosted-glass hero overlays.
  3. Do NOT replace `IBM Plex Serif` + `Mono` contrast with generic geometric sans-serif headings.
  4. Do NOT decorate empty grid cells with abstract 3D orbs or marketing gradients.