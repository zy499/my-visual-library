---
version: "1.1"
name: porcelain-sticker-studio
title: 苹果暖瓷手账风 · Porcelain Sticker Studio
description: |
  A tactile creative-studio web design system fusing Apple's warm-porcelain & midnight-titanium surface refinement with playful handmade 3D die-cut sticker craft, frosted glass, damped spring scroll choreography, curved SVG scroll-rail mascot navigation, and layered studio moodboard stages.
colors:
  paper: "#f9f7f2"
  canvas: "#f5f5f7"
  surface: "#ffffff"
  surface-subtle: "#f5f5f7"
  ink: "#1d1d1f"
  ink-secondary: "#424245"
  muted: "#6e6e73"
  accent: "#0071e3"
  accent-hover: "#0077ed"
  accent-soft: "rgba(0, 113, 227, 0.1)"
  spark: "#f5b942"
  danger: "#d93025"
  line: "rgba(29, 29, 31, 0.09)"
  line-strong: "rgba(29, 29, 31, 0.16)"
  chapter-reference: "#eef4fb"
  chapter-technique: "#f4f1fb"
  chapter-style: "#fbf5ec"
  dark-paper: "#090b10"
  dark-canvas: "#0f1219"
  dark-surface: "#151822"
  dark-surface-subtle: "#1c202e"
  dark-ink: "#f5f5f7"
  dark-muted: "#98989d"
  dark-accent: "#2997ff"
typography:
  display: "SF Pro Display, PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif"
  body: "SF Pro Text, PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif"
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace"
  hero-title: "clamp(46px, 6.4vw, 84px) / 760 / -0.045em / 1.04"
  chapter-title: "clamp(32px, 3.8vw, 52px) / 720 / -0.03em / 1.12"
  body-md: "14px-15px / 400 / 1.65"
rounded:
  badge: "999px"
  input: "12px"
  card: "22px"
  media: "16px"
  dialog: "24px"
  stage: "28px"
motion:
  scroll-spring: "stiffness 155, damping 28, mass 0.55"
  pill-layout-spring: "stiffness 420, damping 34"
  card-hover-ease: "cubic-bezier(0.22, 1, 0.36, 1)"
---

# Design System: Porcelain Sticker Studio（苹果暖瓷手账风）

> **How an AI should use this file**: Treat the CSS tokens, component recipes, motion physics, and guardrails below as binding implementation specs — do not approximate them with generic Tailwind defaults.

## 1. Visual Theme & Dual-Mode Atmosphere

**Porcelain Sticker Studio** balances two deliberate contrasts:
1. **Apple Editorial Calm**: Warm porcelain paper (`#f9f7f2`) in light mode, midnight titanium (`#090b10`) in dark mode (defaulting to OS `prefers-color-scheme` with a 3-way Light / System / Dark pill switcher), frosted glass (`saturate(180%) blur(20px)`), crisp 1px specular sheen borders, generous whitespace, and Apple Cobalt (`#0071e3` / `#2997ff`) as the single primary action accent.
2. **Handmade 3D Sticker Craft**: Die-cut 3D clay/vinyl stickers with thick cream/glass rims (`3px-4.5px`), multi-layer drop shadows, hover/click replay animations, tilted moodboard cards taped with translucent washi tape, a subtle 2.5% procedural paper grain, and an expressive 3D mascot riding a curved vertical scroll rail.

## 2. Production CSS Tokens (Drop Directly Into `styles.css`)

```css
:root {
  --paper: #f9f7f2;
  --canvas: #f5f5f7;
  --surface: #ffffff;
  --surface-subtle: #f5f5f7;
  --ink: #1d1d1f;
  --ink-secondary: #424245;
  --muted: #6e6e73;
  --accent: #0071e3;
  --accent-hover: #0077ed;
  --soft: rgba(0, 113, 227, 0.1);
  --spark: #f5b942;
  --danger: #d93025;
  --line: rgba(29, 29, 31, 0.09);
  --line-strong: rgba(29, 29, 31, 0.16);
  --chapter-reference: #eef4fb;
  --chapter-technique: #f4f1fb;
  --chapter-style: #fbf5ec;
  --card-sheen: inset 0 1px 0 rgba(255, 255, 255, 0.85);
  --shadow-sm: 0 2px 8px rgba(15, 23, 42, 0.05);
  --shadow-md: 0 12px 32px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 24px 60px rgba(15, 23, 42, 0.14);
}

[data-theme="night"] {
  --paper: #090b10;
  --canvas: #0f1219;
  --surface: #151822;
  --surface-subtle: #1c202e;
  --ink: #f5f5f7;
  --ink-secondary: #d1d1d6;
  --muted: #98989d;
  --accent: #2997ff;
  --accent-hover: #40a5ff;
  --soft: rgba(41, 151, 255, 0.16);
  --line: rgba(255, 255, 255, 0.09);
  --line-strong: rgba(255, 255, 255, 0.16);
  --chapter-reference: #0e1624;
  --chapter-technique: #161224;
  --chapter-style: #1d1712;
  --card-sheen: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.34);
  --shadow-md: 0 16px 38px rgba(0, 0, 0, 0.48);
  --shadow-lg: 0 28px 68px rgba(0, 0, 0, 0.64);
}
```

## 3. Signature Surface & Craft Recipes

### A. Frosted Glass Bar / Floating Pill
```css
.glass-pill {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 78%, transparent);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  box-shadow: var(--card-sheen), var(--shadow-sm);
}
```

### B. Subtle Procedural Paper Grain Overlay
```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

### C. Layered Studio Moodboard Card + Washi Tape
- Primary card: `border-radius: 26px`, `1px solid var(--line)`, 3D pointer tilt (`max ±3.5deg`) + radial specular glare following cursor.
- Secondary tilted card: `rotate: -6deg`, `border-radius: 18px`, pinned at top-center with translucent amber washi tape (`rgba(245, 185, 66, 0.38)`, `rotate: -3deg`).
- Giant low-opacity watermark behind each chapter (`font-size: clamp(96px, 14vw, 200px); font-weight: 850; opacity: 0.045; letter-spacing: -0.05em`).

### D. Die-Cut 3D Sticker Button & Hero Layering Rule
- Always mount floating Hero stickers in `.hero-stickers { position: absolute; inset: 0; z-index: 4; pointer-events: none; }` with `button.animated-sticker { pointer-events: auto; cursor: pointer; }` so transparent text margins never block hover/click replay animations.
- For tactile 3D stickers when no bitmap assets exist, craft glossy CSS/SVG die-cut badges with a `3px-4px` `#fffdf9` outer rim, specular highlight gradients, and `drop-shadow(0 12px 16px rgba(15, 23, 42, 0.16))`.

## 4. Layout & Curved Scroll Rail Alignment (Desktop >= 1100px)

1. **Sticky Header**: Left layered double-card squircle brand logo (`34×34px`), center `layoutId` spring-sliding nav pill, right 3-way Light / System / Dark segmented pill (`layoutId="theme-mode-pill"`).
2. **Hero Stage**:
   - Concentric hairline `.hero-halo` rings (`500px` & `760px`).
   - Eyebrow pill -> Bold title with cobalt-to-violet span gradient -> Letter-blur subtitle -> Primary/Secondary CTAs -> 5-card fanned interactive showcase deck (`rotate: -6deg .. +6deg`) -> Frosted chapter dock + scroll cue.
3. **Curved Left SVG Scroll Rail**:
   - Fixed left track (`280px` wide) with curved arc, tick marks, unique 3D sticker per section, and a 3D mascot that glides with damped scroll (`useSpring`), tilts with `useVelocity`, bounces on arrival, and shows speech-bubble quips on click.
   - **Mandatory Unified Desktop Container** (place AFTER base `.chapter-content` / `.library` rules in CSS):
     ```css
     @media (min-width: 1100px) {
       .top .wrap, .library, .chapter-content {
         width: min(100% - 256px, 1240px);
         margin-inline-start: max(204px, calc((100% - 1240px) / 2));
         margin-inline-end: auto;
       }
     }
     ```

## 5. Exact Fanned 5-Card Deck & Motion Code (95%+ Reproduction)

### 5-Card Fanned Deck Geometry (Light Pastel + Night Velvet-Jewel)
```css
.deck-card {
  position: absolute; z-index: var(--stack); width: clamp(128px, 16.4vw, 232px); aspect-ratio: 4/5;
  border: 1px solid rgba(255, 255, 255, 0.72); border-radius: clamp(18px, 1.9vw, 26px);
  background: radial-gradient(ellipse at 14% 4%, rgba(255, 255, 255, 0.56), transparent 62%), var(--card-color);
  transform: translate(calc(var(--x) + var(--shift, 0px)), calc(var(--drop) + var(--lift, 0px))) rotate(var(--angle, var(--tilt)));
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.32s ease;
}
.deck-card:nth-child(1) { --card-color: #d6c8ff; --card-ink: #2c2159; --x: -162%; --drop: 28px; --tilt: -14deg; --stack: 1; }
.deck-card:nth-child(2) { --card-color: #ffbcd4; --card-ink: #572141; --x: -81%;  --drop: 9px;  --tilt: -7.5deg; --stack: 2; }
.deck-card:nth-child(3) { --card-color: #9adeff; --card-ink: #0f385c; --x: 0%;    --drop: -22px; --tilt: -0.8deg; --stack: 3; }
.deck-card:nth-child(4) { --card-color: #c7ea91; --card-ink: #26421d; --x: 81%;   --drop: 9px;  --tilt: 7deg;   --stack: 2; }
.deck-card:nth-child(5) { --card-color: #8bb2fc; --card-ink: #132d63; --x: 162%;  --drop: 28px; --tilt: 14deg;  --stack: 1; }
/* Dark mode overrides: #2f2654 / #492139 / #153452 / #213a25 / #1c2e59 */
```

### Curved Scroll Rail Arc Geometry
```css
.scroll-rail { position: fixed; inset: 50% auto auto 0; z-index: 6; width: 280px; height: min(90vh, 820px); transform: translateY(-50%); pointer-events: none; }
.scroll-rail-curve { position: absolute; top: 50%; left: -1463px; width: 1520px; height: 1520px; border: 1px solid color-mix(in srgb, var(--ink) 11%, transparent); border-radius: 50%; transform: translateY(-50%); }
```

### Motion Choreography & Interactive Engineering Rules

- **Damped Scroll & Backdrop Blending (`motion/react`)**:
  - `useSpring(scrollPosition, { stiffness: 155, damping: 28, mass: 0.42, restDelta: 0.0005 })`
  - Smoothstep `weight = blend * blend * (3 - 2 * blend) * 100` -> `color-mix(in oklab, var(--from), var(--to) ${weight}%)`
- **3D Pointer Tilt + Glare**: Update `--tilt-x`, `--tilt-y`, `--light-x`, `--light-y` inside `requestAnimationFrame` on mouse `pointermove`, resetting cleanly on `pointerleave`.
- **Shared-Element Pills**: `layoutId` with `{ type: "spring", stiffness: 420, damping: 34 }` for nav tabs, filter tabs, and 3-way OS theme switcher (`day | system | night`, defaulting to `system`).
- **Non-Scroll-Locking Dropdowns**: Build custom selects with `@radix-ui/react-popover` (`modal={false}`), NEVER modal `Select` / `react-remove-scroll`, so opening menus never hides the scrollbar or shifts layout.
- **Unified Full-Type Lightbox**: Every card type (images, CSS specimens, animated canvases) opens in one frosted Lightbox supporting `← / →` keyboard navigation, scrollable full text, favorite toggle, and Blob download / copy actions with inline button confirmation.
- **3D Sticker Asset Prompt Formula**: Generate 1:1 3D clay/vinyl die-cut stickers with thick `#fffdf8` cream sticker border on pure `#FFFFFF` background -> flood-fill alpha cutout -> 500px WebP -> apply CSS `drop-shadow` only in browser.
- **Full Reusable Starter Kit**: Complete drop-in `tokens.css`, `motion-primitives.jsx`, and `sticker-prompts.md` are bundled in `skills/porcelain-sticker-studio/references/` (or call MCP tool `get_skill_bundle("porcelain-sticker-studio")`).
- **Accessibility**: Wrap in `<MotionConfig reducedMotion="user">` and implement both `@media (prefers-reduced-motion: reduce)` and `@media (prefers-reduced-transparency: reduce)`.

## 6. Anti-Patterns & 12-Point QA Gate (Strictly Verify)

- Do NOT use generic harsh `#000000` borders or flat pure `#ffffff` backgrounds without porcelain warmth (`#f9f7f2`) and subtle elevation.
- Do NOT reuse the same sticker icon across different scroll-rail chapters.
- Do NOT place interactive stickers under a higher `z-index` full-width `.hero-copy` block.
- Do NOT use scroll-locking dropdowns that cause the page scrollbar to disappear/reappear.
- Do NOT truncate design specs or prompts mid-word in previews.
- Do NOT forget to verify Light + Dark mode, right-edge alignment at >= 1100px, and `Cmd+V` clipboard paste in editors.
