# 3D Clay / Vinyl Die-Cut Sticker & Mascot Asset Recipe

To achieve **95%+ visual fidelity** on the playful handmade sticker craft layer, generate matching transparent die-cut 3D stickers (never mix flat generic icons with 3D clay stickers).

## 1. Scroll-Rail 3D Mascot Image Prompt
Use with any image generator (Nano Banana / GPT Image / Flux / Midjourney):

> Cute minimalist 3D clay/vinyl die-cut sticker mascot of a cheerful chubby pastel sky-blue studio spirit wearing a tiny lavender beret with a glossy miniature camera lens and holding a glowing golden four-point star sparkle. Tactile soft matte vinyl and smooth porcelain sheen, thick warm-cream die-cut sticker border (#fffdf8), centered full-body front-three-quarter pose with friendly waving hand, soft studio global illumination, isolated cleanly on a pure flat solid white background (#FFFFFF) with no drop shadow on the background, Apple-grade playful 3D craft aesthetic, 1:1 square.

## 2. Section / Deck 3D Object Sticker Prompt Template
Swap `[SUBJECT]` for each chapter or feature card (e.g., *vintage color-film camera*, *glass kaleidoscope prism*, *paint roller with dual cyan/pink ink*, *nested 3D colorful frames*, *glowing cobalt neon tube*):

> Tactile 3D clay and glossy vinyl die-cut sticker of `[SUBJECT]`, rounded friendly geometry, soft pastel + cobalt/coral studio accents, crisp warm-cream die-cut sticker outline (#fffdf8), gentle rim highlight, centered isometric 3/4 view, isolated on pure solid flat white background (#FFFFFF), zero background shadows, zero text, 1:1 aspect ratio.

## 3. Cutout & Local Optimization Pipeline
1. Flood-fill remove the pure `#FFFFFF` outer background to clean alpha transparency (keeping the thick `#fffdf8` die-cut rim intact).
2. Resize to `500x500` and compress to WebP (`cwebp -q 85 -resize 500 500 input.png -o sticker.webp`, ~20-50 KB each).
3. Apply CSS drop-shadow only in the browser (`filter: drop-shadow(0 12px 14px rgba(15, 23, 42, 0.16))`) so light & dark modes automatically adapt shadow intensity.

## 4. Zero-Asset Pure CSS Fallback
If no image generator is available, build tactile die-cut CSS badges using:
- Outer rim: `border: 3.5px solid #fffdf9` (dark mode `#2f354a`)
- 3D thickness edge: `box-shadow: inset 0 1px 2px rgba(255,255,255,0.85), 0 4px 0 #dec499, 0 14px 22px rgba(15,23,42,0.16)`
- Glossy spheres/shapes inside with dual `radial-gradient` specular highlights.
