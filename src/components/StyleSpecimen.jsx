export function DynamicStyleCover({ cover }) {
  if (!cover) return null;
  if (cover.type === "design-md") {
    return (
      <div className="sp dyn-dmd" style={{ "--d-bg": cover.bg, "--d-accent": cover.accent, "--d-ink": cover.ink }} aria-hidden="true">
        <div className="dyn-dmd-top">
          <span className="dyn-dmd-tag">DESIGN.MD</span>
          <span className="dyn-dmd-font">{cover.font}</span>
        </div>
        <strong className="dyn-dmd-brand">{cover.brand}</strong>
        <div className="dyn-dmd-swatches">
          {(cover.swatches || []).map((hex) => (
            <span key={hex} className="dyn-swatch" style={{ background: hex }} title={hex} />
          ))}
          <span className="dyn-dmd-pill">Aa</span>
        </div>
      </div>
    );
  }
  if (cover.type === "ui-pro-max") {
    return (
      <div className="sp dyn-upm" style={{ "--d-bg": cover.bg, "--d-accent": cover.accent, "--d-ink": cover.ink }} aria-hidden="true">
        <span className="dyn-upm-glow" />
        <div className="dyn-upm-card">
          <span className="dyn-upm-era">{cover.era}</span>
          <strong className="dyn-upm-name">{cover.name}</strong>
          <div className="dyn-upm-swatches">
            {(cover.swatches || []).map((hex) => (
              <i key={hex} style={{ background: hex }} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (cover.type === "moke-v25") {
    return (
      <div className="sp dyn-moke" style={{ "--d-bg": cover.bg, "--d-accent": cover.accent, "--d-accent2": cover.accent2 }} aria-hidden="true">
        <span className="dyn-moke-orb" />
        <div className="dyn-moke-slate">
          <div className="dyn-moke-head">
            <span className="dyn-moke-num">MOKE V25 · #{cover.num}</span>
            <span className="dyn-moke-dot" />
          </div>
          <strong className="dyn-moke-title">{cover.name}</strong>
          <span className="dyn-moke-medium">{cover.medium}</span>
        </div>
      </div>
    );
  }
  if (cover.type === "moke-film") {
    return (
      <div className="sp sp-cam dyn-film" style={{ "--d-bg": cover.bg, "--d-accent": cover.accent, "--d-accent2": cover.accent2 }} aria-hidden="true">
        <span className="dyn-film-halo" />
        <span className="sp-cam-frame" />
        <span className="sp-cam-badge">{cover.category}</span>
        <strong className="dyn-film-name">{cover.name}</strong>
        <span className="sp-cam-hud">MOKE VISION ONE · FILM PRESET</span>
      </div>
    );
  }
  return null;
}

export default function StyleSpecimen({ kind }) {
  switch (kind) {
    /* ---- 00 本站蒸馏 · 苹果暖瓷手账风 ---- */
    case "porcelain-studio":
      return (
        <div className="sp sp-porcelain" aria-hidden="true">
          <span className="sp-porc-rail"><i /></span>
          <span className="sp-porc-sticker sp-porc-s1">✦</span>
          <span className="sp-porc-sticker sp-porc-s2" />
          <div className="sp-porc-card">
            <span className="sp-porc-tape" />
            <span className="sp-porc-pill">DESIGN.MD · SKILL</span>
            <strong>苹果暖瓷手账风</strong>
            <div className="sp-porc-swatches">
              <i style={{ background: "#f9f7f2" }} />
              <i style={{ background: "#0071e3" }} />
              <i style={{ background: "#f5b942" }} />
              <i style={{ background: "#151822" }} />
            </div>
          </div>
        </div>
      );
    /* ---- 01 网页与界面 (UI / DESIGN.md) ---- */
    case "liquid-glass":
      return (
        <div className="sp sp-liquid" aria-hidden="true">
          <span className="sp-liquid-orb sp-liquid-orb-1" />
          <span className="sp-liquid-orb sp-liquid-orb-2" />
          <div className="sp-liquid-card">
            <span className="sp-liquid-pill">Liquid Glass</span>
            <strong>通透折射</strong>
            <div className="sp-dots"><i /><i /><i /></div>
          </div>
        </div>
      );
    case "linear-dark":
      return (
        <div className="sp sp-linear" aria-hidden="true">
          <span className="sp-linear-glow" />
          <div className="sp-linear-window">
            <div className="sp-linear-bar"><i /><i /><i /><span>LIN-204</span></div>
            <div className="sp-linear-row"><span className="sp-linear-dot" /><strong>Precision UI</strong><em>⌘K</em></div>
            <div className="sp-linear-line" />
          </div>
        </div>
      );
    case "vercel-mono":
      return (
        <div className="sp sp-vercel" aria-hidden="true">
          <span className="sp-vc-cross sp-vc-tl">+</span>
          <span className="sp-vc-cross sp-vc-br">+</span>
          <span className="sp-vc-tri" />
          <strong className="sp-vc-title">GEIST / MONO</strong>
        </div>
      );
    case "claude-warm":
      return (
        <div className="sp sp-claude" aria-hidden="true">
          <div className="sp-cl-sheet">
            <span className="sp-cl-mark">✳</span>
            <strong>Warm Editorial</strong>
            <span className="sp-cl-bar" />
          </div>
        </div>
      );
    case "teenage-hardware":
      return (
        <div className="sp sp-te" aria-hidden="true">
          <div className="sp-te-panel">
            <div className="sp-te-oled"><span>OP-FIELD</span><em>120 BPM</em></div>
            <div className="sp-te-keys">
              <i className="sp-te-orange" /><i /><i /><i className="sp-te-dark" />
            </div>
          </div>
        </div>
      );
    case "neo-brutalism":
      return (
        <div className="sp sp-brutal" aria-hidden="true">
          <div className="sp-brutal-box">
            <span className="sp-brutal-badge">BOLD!</span>
            <strong>NEO BRUTAL</strong>
          </div>
        </div>
      );

    /* ---- 02 平面与排版 (Graphic / Editorial) ---- */
    case "swiss-editorial":
      return (
        <div className="sp sp-swiss" aria-hidden="true">
          <div className="sp-swiss-grid"><i /><i /><i /><i /></div>
          <span className="sp-swiss-num">01</span>
          <div className="sp-swiss-meta">
            <strong>SWISS GRID</strong>
            <span>HELVETICA · 4 COL</span>
          </div>
          <span className="sp-swiss-accent" />
        </div>
      );
    case "risograph-zine":
      return (
        <div className="sp sp-riso" aria-hidden="true">
          <span className="sp-riso-c1" />
          <span className="sp-riso-c2" />
          <span className="sp-riso-tag">RISO 2-INK</span>
        </div>
      );
    case "tokyo-editorial":
      return (
        <div className="sp sp-tokyo" aria-hidden="true">
          <div className="sp-tokyo-frame">
            <span className="sp-tokyo-vert">静谧画册</span>
            <span className="sp-tokyo-line" />
            <span className="sp-tokyo-en">ISSUE 04 · TOKYO</span>
          </div>
        </div>
      );
    case "bauhaus-play":
      return (
        <div className="sp sp-bauhaus" aria-hidden="true">
          <span className="sp-bh-circle" />
          <span className="sp-bh-rect" />
          <span className="sp-bh-tri" />
          <span className="sp-bh-bar" />
        </div>
      );
    case "botanical-archive":
      return (
        <div className="sp sp-botanical" aria-hidden="true">
          <svg className="sp-bot-svg" viewBox="0 0 120 80" fill="none">
            <path d="M22 68 C 44 54, 62 34, 96 14" stroke="#F3EFE4" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="44" cy="46" rx="14" ry="6" transform="rotate(-35 44 46)" fill="#F3EFE4" fillOpacity="0.88" />
            <ellipse cx="64" cy="33" rx="13" ry="5.5" transform="rotate(-30 64 33)" fill="#F3EFE4" fillOpacity="0.82" />
            <ellipse cx="56" cy="54" rx="12" ry="5" transform="rotate(14 56 54)" fill="#F3EFE4" fillOpacity="0.72" />
            <ellipse cx="78" cy="40" rx="11" ry="4.5" transform="rotate(10 78 40)" fill="#F3EFE4" fillOpacity="0.68" />
          </svg>
          <span className="sp-bot-label">FIG. 10 · CYANOTYPE</span>
        </div>
      );
    case "cyber-terminal":
      return (
        <div className="sp sp-cyber" aria-hidden="true">
          <div className="sp-cyber-head">
            <span>SYS://06</span>
            <span className="sp-cyber-live">● LIVE</span>
          </div>
          <strong className="sp-cyber-code">&gt; RENDER_OK</strong>
          <div className="sp-cyber-bars"><i /><i /><i /><i /></div>
        </div>
      );

    /* ---- 03 影像与胶片 (MOKE 虚拟相机范式 / Cinema) ---- */
    case "moke-portra":
      return (
        <div className="sp sp-cam sp-portra" aria-hidden="true">
          <span className="sp-cam-sun" />
          <span className="sp-cam-frame" />
          <span className="sp-cam-badge">PORTRA 400</span>
          <span className="sp-cam-hud">80mm · f/2.0 · +0.7 EV</span>
        </div>
      );
    case "moke-fuji-chrome":
      return (
        <div className="sp sp-cam sp-fuji" aria-hidden="true">
          <span className="sp-fuji-arch" />
          <span className="sp-cam-frame" />
          <span className="sp-cam-badge">CLASSIC CHROME</span>
          <span className="sp-cam-hud">35mm · f/4.0 · ISO 400</span>
        </div>
      );
    case "cinema-kodachrome":
      return (
        <div className="sp sp-cinema" aria-hidden="true">
          <span className="sp-cinema-bar sp-cinema-top" />
          <div className="sp-cinema-glow" />
          <span className="sp-cinema-sub">2.39:1 · VISION3 500T</span>
          <span className="sp-cinema-bar sp-cinema-bot" />
        </div>
      );
    case "moke-wkw-neon":
      return (
        <div className="sp sp-cam sp-wkw" aria-hidden="true">
          <span className="sp-wkw-glow" />
          <span className="sp-wkw-trail" />
          <span className="sp-cam-frame" />
          <span className="sp-cam-badge">CINESTILL 800T</span>
          <span className="sp-cam-hud">28mm · 1/15s · HALATION</span>
        </div>
      );
    case "moke-hasselblad-still":
      return (
        <div className="sp sp-cam sp-hassel" aria-hidden="true">
          <span className="sp-hassel-sphere" />
          <span className="sp-cam-frame sp-cam-frame-dark" />
          <span className="sp-cam-badge sp-cam-badge-dark">STUDIO 120</span>
          <span className="sp-cam-hud sp-cam-hud-dark">90mm · f/8.0 · SOFTBOX</span>
        </div>
      );
    case "moke-leica-mono":
      return (
        <div className="sp sp-cam sp-leica" aria-hidden="true">
          <span className="sp-leica-beam" />
          <span className="sp-cam-frame" />
          <span className="sp-cam-badge">TRI-X 400</span>
          <span className="sp-cam-hud">50mm · f/2.0 · PUSH +2</span>
        </div>
      );

    /* ---- 04 生图与画风 (Modern AI Art / 3D) ---- */
    case "tactile-clay":
      return (
        <div className="sp sp-clay" aria-hidden="true">
          <span className="sp-clay-pill">
            <i />
            <em>CLAY 3D</em>
          </span>
          <span className="sp-clay-ball" />
        </div>
      );
    case "y2k-chrome":
      return (
        <div className="sp sp-y2k" aria-hidden="true">
          <span className="sp-y2k-ring" />
          <span className="sp-y2k-pill">CHROME 2000</span>
          <span className="sp-y2k-star sp-y2k-s1">✦</span>
          <span className="sp-y2k-star sp-y2k-s2">✦</span>
        </div>
      );
    case "zen-ink":
      return (
        <div className="sp sp-zen" aria-hidden="true">
          <span className="sp-zen-wash" />
          <strong className="sp-zen-title">留白墨韵</strong>
          <span className="sp-zen-seal">墨</span>
        </div>
      );
    case "iso-diorama":
      return (
        <div className="sp sp-iso" aria-hidden="true">
          <div className="sp-iso-cube">
            <span className="sp-iso-top" />
            <span className="sp-iso-left" />
            <span className="sp-iso-right" />
            <span className="sp-iso-lamp" />
          </div>
          <span className="sp-iso-tag">ISOMETRIC 45°</span>
        </div>
      );
    case "ghibli-gouache":
      return (
        <div className="sp sp-ghibli" aria-hidden="true">
          <span className="sp-gh-cloud sp-gh-c1" />
          <span className="sp-gh-cloud sp-gh-c2" />
          <span className="sp-gh-hill" />
          <span className="sp-gh-tag">GOUACHE</span>
        </div>
      );
    case "wool-felt-stopmotion":
      return (
        <div className="sp sp-felt" aria-hidden="true">
          <span className="sp-felt-buddy">
            <i /><i />
          </span>
          <span className="sp-felt-tag">NEEDLE FELT</span>
        </div>
      );
    default:
      return null;
  }
}
