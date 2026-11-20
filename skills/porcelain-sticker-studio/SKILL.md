---
name: porcelain-sticker-studio
description: Build modern creative-studio websites, visual reference libraries, portfolios, or interactive product showcases at 95%+ fidelity using the Porcelain Sticker Studio design system — complete with drop-in CSS tokens, Motion/React spring physics, 3-way OS theme switcher, non-locking Popover selects, 3D die-cut sticker prompts, and a 12-point QA checklist.
---

# Porcelain Sticker Studio — 95%+ Fidelity Website Skill

Use this skill whenever the user asks to design or build a website in the **「我的视觉库 / 苹果暖瓷手账风（Porcelain Sticker Studio）」** aesthetic.

## Included Reference Kit (Read & Reuse Directly — Do NOT Guess)

1. **`references/tokens.css`** — Complete production CSS foundation: Warm Porcelain light tokens (`#f9f7f2 / #f5f5f7 / #ffffff / #0071e3`), Midnight Titanium dark tokens (`#090b10 / #0f1219 / #151822 / #2997ff`), 2.5% SVG paper grain, frosted top bar, 3-way theme pill, curved SVG scroll rail (`left: -1463px; width: 1520px`), concentric Hero halos, 5-card fanned deck (light pastels + night velvet-jewels), pointer tilt glare, unified desktop container alignment, and reduced-motion/transparency fallbacks.
2. **`references/motion-primitives.jsx`** — Exact working React 19 + `motion/react` + `@radix-ui/react-popover` primitives: `useChapterScroll` (`stiffness: 155, damping: 28, mass: 0.42`), `useChapterBackdrop` (smoothstep `color-mix(in oklab, ...)`), `usePointerTilt`, `useSystemTheme` + `ThemeSwitcher` (Light / System / Dark), `NonLockingSelect` (`modal={false}`), and `BrandLogo`.
3. **`references/sticker-prompts.md`** — Exact 3D clay/vinyl die-cut mascot & sticker image-generation prompts, alpha-cutout WebP pipeline, and pure CSS 3D fallback recipes.
4. **Full `DESIGN.md`**: `图鉴素材/design-md/porcelain-sticker-studio.md` (also retrievable via MCP `get_skill_bundle` or `get_card_detail`).

## 5-Step Build Workflow

1. **Install foundation**: React 19 + `motion` (`motion/react`) + `@radix-ui/react-popover` + `lucide-react`. Copy `references/tokens.css` as your base token & surface layer.
2. **Wire Shell & Theme**: Mount `<MotionConfig reducedMotion="user">`, copy `useSystemTheme` + `ThemeSwitcher` (default `"system"` following OS `prefers-color-scheme`), sticky frosted header with `layoutId="top-nav-pill"`, and layered double-card `BrandLogo` (+ matching SVG favicon).
3. **Build Hero & Curved Scroll Rail**: Implement concentric `.hero-halo` rings, eyebrow stat pill, cobalt-violet display title, 5-card fanned `.deck` (`--x: -162% / -81% / 0% / 81% / 162%`, `--tilt: -14deg .. +14deg`), frosted chapter dock, and floating 3D stickers at `z-index: 4` (with `pointer-events: none` on `.hero-stickers` and `.hero-copy`). Mount the left curved `.scroll-rail` with unique 3D sticker icons per chapter and an animated 3D mascot.
4. **Build Moodboard Chapters & Gallery**: Wire `useChapterScroll` + `useChapterBackdrop` for smoothstep pastel/titanium chapter washes. Give each chapter a giant low-opacity watermark (`01 / 02 / 03`), primary 3D-tilted card (`usePointerTilt`), tilted secondary card pinned with translucent washi tape, floating frosted widget, and clickable quick tags. Align `.chapter-content` and `.library` on the exact same desktop container rule (`width: min(100% - 256px, 1240px); margin-inline-start: max(204px, calc((100% - 1240px) / 2))`).
5. **Generate 3D Stickers & Run 12-Point QA**: Generate matching transparent die-cut 3D stickers via `references/sticker-prompts.md` (or use the CSS 3D fallback if no image tool is available), then verify every item below before finishing.

## Mandatory 12-Point Visual & Interaction Self-Audit (95%+ Gate)

- [ ] Default theme follows OS (`system`), live-updates on OS change, and switches smoothly across Light / System / Dark via a 3-way sliding pill.
- [ ] Both Light (Warm Porcelain `#f9f7f2`) and Dark (Midnight Titanium `#090b10` + velvet-jewel deck cards) have crisp AA/AAA text contrast.
- [ ] Subtle 2.5% SVG paper grain overlay + `saturate(180%) blur(20px)` frosted glass with 1px specular top sheen.
- [ ] All floating Hero stickers respond to hover & click (never blocked by `.hero-copy` transparent margins).
- [ ] Every chapter on the left ScrollRail has a **unique** 3D sticker icon (zero duplicates).
- [ ] Desktop right edge of Hero / Chapters / Main Grid aligns cleanly (container alignment `@media (min-width: 1100px)` placed AFTER base rules).
- [ ] Scroll transitions use damped spring physics (`155/28`) + smoothstep `color-mix(in oklab, ...)` backdrop washes.
- [ ] All dropdown selects use non-modal `Popover` (`modal={false}`) — opening any dropdown NEVER hides the scrollbar or shifts layout.
- [ ] Every card type (images, CSS specimens, animated canvases) opens in the unified Lightbox with `← / →` keyboard navigation and non-truncated scrollable details.
- [ ] Modal inputs have visible contrast (`--surface-subtle` fill + `--line-strong` border on white modals) and image uploaders support `Cmd+V` paste.
- [ ] File downloads use `fetch` + `Blob` + `URL.createObjectURL` with immediate inline button confirmation (`✓ 已下载`).
- [ ] Both `prefers-reduced-motion: reduce` and `prefers-reduced-transparency: reduce` degrade cleanly.
