---
name: visual-library-distill
description: Distill any website, UI prototype, or visual reference into a reusable DESIGN.md design system + Agent Skill and save it directly into the local Visual Library via MCP (save_visual_card).
---

# Distill a Website Style into `DESIGN.md` & Local Visual Library

When the user shows a website, repo, or screenshot and asks to **distill its design style into a reusable skill/design system** and save it to 「我的视觉库」, follow this 4-step workflow:

## Step 1: Audit Concrete Visual Tokens (No Vague Adjectives)
Extract real measurable values from CSS / DOM / screenshots:
1. **Color Palette & Surface Ladder**: Paper/canvas base, card surface, subtle surface, hairline border, primary ink, secondary/muted ink, primary accent, semantic colors, and dark-mode equivalents.
2. **Typography**: Font stack, display vs body scale, weights, negative tracking, `tabular-nums`, OpenType features (`ss03`, `liga`, etc.).
3. **Material & Craft Signature**: Border radii scale, shadow elevation layers, glass blur/saturation, grain/texture, border style, or distinctive visual motifs (e.g. die-cut stickers, washi tape, terminal grids).
4. **Motion & Interaction Physics**: Easing curves, spring `stiffness / damping`, scroll choreography, hover/focus feedback, and reduced-motion fallbacks.
5. **Layout & Anti-Patterns**: Grid/container alignment, whitespace ratio, component anatomy, and 3–5 concrete "Avoid / Do Not" guardrails.

## Step 2: Produce a Self-Contained `DESIGN.md`
Write clean YAML frontmatter (`name`, `title`, `description`, `colors`, `typography`, `rounded`, `spacing`, `motion`) followed by concise Markdown sections:
1. Visual Theme & Atmosphere
2. Color System & Roles
3. Layout & Structural Rhythm
4. Component & Interaction Specs
5. Motion & Accessibility / Anti-Patterns

## Step 3: Save Directly into 「我的视觉库」 via MCP
Call the local `visual-library` MCP tool `save_visual_card` with:
- `type`: `"style"`
- `track`: `"ui"` (or `"graphic"` / `"cinema"` / `"ai-art"`)
- `title`: `<中文风格名> · <English Name>`
- `tags`: `["风格库", "DESIGN.md", "<对应赛道>", "<风格关键词>"]`
- `note`: 1–2 sentence Chinese positioning summary
- `recipe`: Crisp structured Chinese summary + self-contained English prompt tokens
- `designMdSlug`: lowercase hyphen slug (e.g. `"my-brand-studio"`)
- `designMdContent`: Full `DESIGN.md` markdown content (automatically written to `图鉴素材/design-md/<slug>.md`)

## Step 4: Verify Reuse
Confirm the saved card ID and explain how any AI agent (Antigravity, Cursor, Codex, WorkBuddy, DeepSeek Harness) can pull the full spec on future tasks via `get_card_detail` or `list_design_systems`.
