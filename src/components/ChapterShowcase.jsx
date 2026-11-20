import { useCallback, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, useTransform } from "motion/react";
import { ArrowDownRight, Palette, ScanEye, SlidersHorizontal, Sparkles } from "lucide-react";
import { chapters, showcaseChapters } from "../chapters.js";
import { asset } from "../library-data.js";
import AnimatedSticker from "./AnimatedSticker.jsx";
import { CatalogCredit, CatalogMedia } from "./Media.jsx";
import { usePointerTilt } from "./usePointerTilt.js";

function StageSecondaryCard({ kind }) {
  if (kind === "reference") {
    return (
      <div className="chapter-secondary chapter-secondary-ref" aria-hidden="true">
        <span className="chapter-washi" />
        <img src={asset("atlas/参考图/cyanotype.webp")} alt="" loading="lazy" decoding="async" />
        <span className="chapter-secondary-caption">蓝晒印相 · Cyanotype</span>
      </div>
    );
  }
  if (kind === "technique") {
    return (
      <div className="chapter-secondary chapter-secondary-motion" aria-hidden="true">
        <span className="chapter-washi chapter-washi-violet" />
        <div className="keyframe-head">
          <span>KEYFRAMES</span>
          <span>24 FPS</span>
        </div>
        <div className="keyframe-strip">
          <div className="kf-cell">
            <span className="kf-dot kf-dot-1" />
            <em>01 蓄力</em>
          </div>
          <div className="kf-cell">
            <span className="kf-dot kf-dot-2" />
            <em>02 加速</em>
          </div>
          <div className="kf-cell">
            <span className="kf-dot kf-dot-3" />
            <em>03 定格</em>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="chapter-secondary chapter-secondary-style" aria-hidden="true">
      <span className="chapter-washi chapter-washi-warm" />
      <span className="type-spec-kicker">TYPOGRAPHY SPEC</span>
      <strong className="type-spec-serif">宋体标题</strong>
      <span className="type-spec-sans">无衬线正文 · 38% 留白</span>
      <div className="type-spec-bars"><i /><i /><i /></div>
    </div>
  );
}

function StageFloatWidget({ kind }) {
  if (kind === "reference") {
    return (
      <div className="chapter-float-widget" aria-hidden="true">
        <div className="float-widget-head">
          <Palette size={13} />
          <span>Riso 叠印色盘</span>
        </div>
        <div className="float-swatches">
          <span className="float-swatch"><i style={{ background: "#f04e6e" }} /><em>荧光粉</em></span>
          <span className="float-swatch"><i style={{ background: "#232730" }} /><em>炭墨黑</em></span>
          <span className="float-swatch"><i style={{ background: "#f2ece1" }} /><em>棉纸底</em></span>
        </div>
      </div>
    );
  }
  if (kind === "technique") {
    return (
      <div className="chapter-float-widget float-widget-curve" aria-hidden="true">
        <div className="float-widget-head">
          <SlidersHorizontal size={13} />
          <span>预备缓动曲线</span>
          <em className="float-widget-pill">0.48s</em>
        </div>
        <svg className="curve-svg" viewBox="0 0 132 46" fill="none">
          <line x1="6" y1="36" x2="126" y2="36" stroke="currentColor" strokeOpacity="0.16" strokeDasharray="3 3" />
          <line x1="6" y1="10" x2="126" y2="10" stroke="currentColor" strokeOpacity="0.16" strokeDasharray="3 3" />
          <path d="M8 35 C 24 44, 42 44, 54 24 C 68 4, 88 10, 124 10" stroke="var(--chapter-accent)" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="8" cy="35" r="3" fill="var(--surface)" stroke="var(--chapter-accent)" strokeWidth="2" />
          <circle cx="38" cy="40" r="3" fill="var(--chapter-accent)" />
          <circle cx="124" cy="10" r="3" fill="var(--surface)" stroke="var(--chapter-accent)" strokeWidth="2" />
        </svg>
      </div>
    );
  }
  return (
    <div className="chapter-float-widget" aria-hidden="true">
      <div className="float-widget-head">
        <Sparkles size={13} />
        <span>固定三色配方</span>
      </div>
      <div className="float-recipe-chips">
        <span className="recipe-chip"><i style={{ background: "#a84029" }} /><em>朱红</em></span>
        <span className="recipe-chip"><i style={{ background: "#2a332c" }} /><em>松墨</em></span>
        <span className="recipe-chip"><i style={{ background: "#e9dbc1" }} /><em>暖纸</em></span>
      </div>
    </div>
  );
}

function ChapterPreview({ chapter, active, onImage, stickerOffset, secondaryOffset, widgetOffset }) {
  const reducedMotion = useReducedMotion();
  const preview = useRef(null);
  const inView = useInView(preview, { amount: 0.22 });
  const [playOverride, setPlayOverride] = useState(undefined);
  const playing = inView && (playOverride ?? (active && !reducedMotion));
  const togglePlayback = useCallback(() => {
    setPlayOverride(!playing);
  }, [playing]);
  const pointer = usePointerTilt(4);
  const id = chapter.type;

  return (
    <div ref={preview} className="chapter-visual" {...pointer}>
      <span className="chapter-crop chapter-crop-tl" aria-hidden="true" />
      <span className="chapter-crop chapter-crop-br" aria-hidden="true" />

      <motion.div className="chapter-secondary-layer"
        style={reducedMotion ? undefined : { y: secondaryOffset }}>
        <StageSecondaryCard kind={id} />
      </motion.div>

      <motion.div className="chapter-visual-surface"
        style={reducedMotion ? undefined : { "--sticker-parallax": stickerOffset }}>
        <article className="chapter-preview">
          <div className="chapter-preview-media">
            {id === "style"
              ? <div className="chapter-paper" aria-label="暖纸底、宋体标题与朱红强调色的风格示例">
                  <div className="chapter-paper-meta" aria-hidden="true">
                    <span>ISSUE 03 · 风格配方</span>
                    <span>暖纸 × 朱红</span>
                  </div>
                  <div className="chapter-paper-title">纸本编辑部</div>
                  <div className="chapter-swatches" aria-hidden="true">
                    <span className="chapter-swatch"><i /><em>#A84029</em></span>
                    <span className="chapter-swatch"><i /><em>#2A332C</em></span>
                    <span className="chapter-swatch"><i /><em>#E9DBC1</em></span>
                  </div>
                </div>
              : <CatalogMedia entry={{ origin: id === "reference" ? "atlas" : "motion", key: chapter.key }}
                  title={chapter.example} playing={playing} onPlay={togglePlayback} onImage={onImage} />}
          </div>
          <div className="chapter-preview-caption">
            <strong>{chapter.example}</strong>
            <span>{id === "reference" ? <CatalogCredit entry={{ origin: "atlas", key: chapter.key }} /> : chapter.source}</span>
          </div>
        </article>
        <AnimatedSticker name={chapter.sticker} className="chapter-sticker" active={active && inView && !reducedMotion} />
        <span className="chapter-glare" aria-hidden="true" />
      </motion.div>

      <motion.div className="chapter-widget-layer"
        style={reducedMotion ? undefined : { y: widgetOffset }}>
        <StageFloatWidget kind={id} />
      </motion.div>
    </div>
  );
}

function ChapterContent({ chapter, index, position, active, onBrowse, onImage }) {
  const reducedMotion = useReducedMotion();

  const copyY = useTransform(position, [index - 1, index, index + 1], [24, 0, -24]);
  const copyOpacity = useTransform(position, [index - 0.9, index - 0.24, index + 0.28, index + 0.92], [0.22, 1, 1, 0.24]);

  const mediaY = useTransform(position, [index - 1, index, index + 1], [38, 0, -24]);
  const mediaScale = useTransform(position, [index - 0.95, index - 0.16, index + 0.24, index + 0.95], [0.93, 1, 1, 0.96]);
  const mediaRotateX = useTransform(position, [index - 0.95, index, index + 0.95], [3.5, 0, -2]);
  const mediaOpacity = useTransform(position, [index - 0.88, index - 0.22, index + 0.3, index + 0.95], [0.2, 1, 1, 0.25]);
  const pointerEvents = useTransform(mediaOpacity, (value) => value < 0.08 ? "none" : "auto");

  const watermarkY = useTransform(position, [index - 1, index, index + 1], [-26, 0, 26]);
  const stickerOffset = useTransform(position, [index - 1, index, index + 1], ["24px", "0px", "-24px"]);
  const secondaryOffset = useTransform(position, [index - 1, index, index + 1], [22, 0, -18]);
  const widgetOffset = useTransform(position, [index - 1, index, index + 1], [30, 0, -26]);

  const titleId = `${chapter.id}-title`;
  return (
    <section className="chapter-screen" id={chapter.id} data-kind={chapter.type} aria-labelledby={titleId}>
      <div className="chapter-backdrop-art" aria-hidden="true">
        <span className="chapter-orb chapter-orb-a" />
        <span className="chapter-orb chapter-orb-b" />
        <motion.div className="chapter-watermark" style={reducedMotion ? undefined : { y: watermarkY }}>
          <span className="chapter-watermark-num">{chapter.indexLabel}</span>
          <span className="chapter-watermark-word">{chapter.watermark}</span>
        </motion.div>
      </div>

      <div className="chapter-content">
        <motion.div className="chapter-copy"
          style={reducedMotion ? undefined : { y: copyY, opacity: copyOpacity }}>
          <div className="chapter-meta-row">
            <p className="chapter-label">
              <span className="chapter-index" aria-hidden="true">{chapter.indexLabel}</span>
              <span>{chapter.label}</span>
            </p>
            <span className="chapter-stat">{chapter.stat}</span>
          </div>
          <h2 id={titleId}>{chapter.title}<br /><span>{chapter.emphasis}</span></h2>
          <p className="chapter-description">{chapter.description}</p>
          <aside className="chapter-note">
            <ScanEye size={18} aria-hidden="true" />
            <p>{chapter.note}</p>
          </aside>
          <div className="chapter-cta-group">
            <button className="btn chapter-jump" type="button" onClick={() => onBrowse(chapter.type)}>
              浏览{chapter.label}<ArrowDownRight size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="chapter-quick-tags" aria-label={`${chapter.label}快捷筛选`}>
            {chapter.quickTags.map(({ label, tag }) => (
              <button key={tag} type="button" className="chapter-quick-tag"
                onClick={() => onBrowse(chapter.type, tag)}>
                <span aria-hidden="true">#</span>{label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div className="chapter-preview-motion"
          style={reducedMotion ? undefined : {
            y: mediaY,
            scale: mediaScale,
            rotateX: mediaRotateX,
            opacity: mediaOpacity,
            pointerEvents,
            transformPerspective: 1200,
          }}>
          <ChapterPreview chapter={chapter} active={active} onImage={onImage}
            stickerOffset={stickerOffset} secondaryOffset={secondaryOffset} widgetOffset={widgetOffset} />
        </motion.div>
      </div>
    </section>
  );
}

export default function ChapterShowcase({ active, position, onBrowse, onImage }) {
  return (
    <div className="chapter-showcase">
      {showcaseChapters.map((chapter) => (
        <ChapterContent key={chapter.id} chapter={chapter} index={chapters.indexOf(chapter)}
          position={position} active={chapters[active] === chapter} onBrowse={onBrowse} onImage={onImage} />
      ))}
    </div>
  );
}
