---
name: granola-editorial-notebook
title: Granola 暖绿笔记编辑风 · Granola Editorial Notebook
description: Tactile stationery-inspired AI product UI modeled on Granola.ai (2026 Ragged Edge rebrand) — snow-paper surfaces (#F7F7F2), mist cards (#EAEBE5), warm pea-green (#B2C248) & deep lime (#5B6F00) accents, Quadrant serif display + Melange body, and zero generic AI glow.
colors:
  canvas: "#FFFFFF"
  surfaceLow: "#F7F7F2"
  surfaceCard: "#EAEBE5"
  surfaceHigh: "#D5D5D2"
  inkStrong: "#0E0F0C"
  inkPrimary: "#292929"
  inkSecondary: "#72726E"
  inkMuted: "#ACADA8"
  accentPrimary: "#B2C248"
  accentDeep: "#5B6F00"
  accentAmber: "#E0C976"
  borderHairline: "#0000001A"
  borderWarm: "#47432A33"
typography:
  display: "Quadrant, QuadrantNotepad, Georgia, serif"
  body: "Melange, Inter, -apple-system, sans-serif"
  h1: "56px / 600 / 1.08 / -0.03em"
  h2: "36px / 600 / 1.15 / -0.02em"
  bodySize: "16px / 400 / 1.55"
  caption: "13px / 500 / 1.4"
rounded:
  button: "9999px"
  chip: "8px"
  card: "16px"
spacing:
  baseUnit: "4px"
  sectionGap: "96px"
  cardPadding: "24px"
  gridGap: "16px"
motion:
  easing: "cubic-bezier(0.22, 1, 0.36, 1)"
  hoverMs: 180
---

# Granola Editorial Notebook (`granola-editorial-notebook`)

## 1. Visual Theme & Atmosphere
An anti-AI-cliché, stationery-inspired productivity interface modeled on Granola.ai's 2026 identity by Ragged Edge. Rather than dark-mode neon gradients or floating glowing orbs, the system evokes a trusted, dog-eared physical notebook: warm off-white snow paper, earthy pea-green and deep moss accents, tactile hairline dividers, and characterful mechanical-serif headlines that feel human and grounded.

## 2. Color System & Roles
- **Page Canvas (`#FFFFFF`) & Low Paper (`#F7F7F2`)**: Alternates crisp white editorial sections with warm snow-paper container bands.
- **Card Surface Ladder**: Mist `#EAEBE5` for soft content containers and note previews; Silver `#D5D5D2` for elevated interactive states.
- **Ink Hierarchy**: Strong charcoal `#0E0F0C` for headings, graphite `#292929` for body prose, slate `#72726E` for secondary captions, and `#ACADA8` for quiet metadata.
- **Earthy Brand Accents**: Signature warm pea-green `#B2C248` for brand highlights and hero badges, deep lime `#5B6F00` for high-contrast primary actions, and warm amber `#E0C976` for subtle editorial highlights. Secondary pastel tags (`#FEBE29`, `#FF91E0`, `#CEBEF8`, `#D2E4F8`) appear strictly inside small category chips/icons.
- **Borders**: Subtle `1px solid #0000001A` (10% black) and `#47432A33` (20% warm umber) dividers instead of heavy drop shadows.

## 3. Layout & Structural Rhythm
- **Modular Grid (`4px / 8px / 16px` steps)**: Generous `24px` internal card padding and `96px` vertical section breathing room.
- **Live Notebook Artifacts**: Feature blocks embed clean, readable meeting-note and transcript fragments directly inside `#F7F7F2` / `#EAEBE5` cards rather than abstract marketing illustrations.
- **Tactile Hierarchy**: Generous whitespace and clear typographic contrast keep dense note workflows calm and scannable.

## 4. Component & Interaction Specs
- **Typography Pairing**: `Quadrant` / `QuadrantNotepad` (mechanical slab-serif) for display headings paired with `Melange` (humanist sans) for body and UI controls; optional handwritten script flourishes reserved solely for subtle human annotations.
- **Buttons & Inputs**: Full-pill `9999px` primary CTAs (`#5B6F00` or `#0E0F0C` fill) and restrained `8px` radius for small chips/inputs.
- **Notebook Cards**: `16px` border radius with `1px solid #0000001A` hairline stroke and soft ambient elevation (`0 6px 20px rgba(14, 15, 12, 0.05)`).
- **Iconography**: Phosphor Duotone style icons matching the warm, approachable stationery tone.

## 5. Motion & Accessibility / Anti-Patterns
- **Motion Physics**: Brisk `180ms` ease-out (`cubic-bezier(0.22, 1, 0.36, 1)`) for button presses and card hover states; zero heavy 3D parallax or sluggish transitions; provide `prefers-reduced-motion` opacity-only fallback.
- **Anti-Patterns (Avoid / Do Not)**:
  1. Do NOT use dark-mode purple-to-blue AI gradients, glowing mesh blobs, or generic sparkle icons.
  2. Do NOT pair cold clinical `#0000FF` links or neon `#00FF00` badges with `#F7F7F2` warm paper.
  3. Do NOT overload cards with thick drop shadows; rely on `#EAEBE5` surface contrast and `#0000001A` hairlines.
  4. Do NOT use oversized rounded bubbles (>20px) on dense note-taking panels or over-saturate secondary pastel tag colors across full backgrounds.