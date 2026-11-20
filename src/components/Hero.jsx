import { useRef } from "react";
import { motion, useInView, useReducedMotion, useTransform } from "motion/react";
import { ArrowDown, ChevronDown, Sparkles } from "lucide-react";
import { asset, featured } from "../library-data.js";
import AnimatedSticker, { Sticker } from "./AnimatedSticker.jsx";
import BlurText from "./BlurText.jsx";
import { usePointerTilt } from "./usePointerTilt.js";

const dockItems = [
  { id: "chapter-reference", index: "01", label: "视觉参考", count: "504", accent: "#0071e3" },
  { id: "chapter-technique", index: "02", label: "动效与技法", count: "240", accent: "#7c4dff" },
  { id: "chapter-style", index: "03", label: "风格库", count: "469", accent: "#c96228" },
];

function FeaturedCard({ feature, onOpen }) {
  const pointer = usePointerTilt(5);
  return (
    <button className="deck-card" type="button" aria-haspopup="dialog" {...pointer}
      onClick={() => onOpen(feature)}>
      <span className="deck-heading">
        <span><strong>{feature.title}</strong><small>{feature.category}</small></span>
        <span className="deck-arrow" aria-hidden="true">↗</span>
      </span>
      <img className="deck-image" src={asset(`贴纸/${feature.id}.webp`)} alt="" width="500" height="500"
        decoding="async" draggable="false" />
    </button>
  );
}

export default function Hero({ position, onOpen, onBrowse }) {
  const reducedMotion = useReducedMotion();
  const hero = useRef(null);
  const inView = useInView(hero, { amount: 0.35 });
  const animateStickers = inView && !reducedMotion;
  const intro = "收藏视觉参考，拆解动效，整理风格配方";

  const copyY = useTransform(position, [0, 0.88], [0, -48]);
  const copyScale = useTransform(position, [0, 0.88], [1, 0.965]);
  const copyOpacity = useTransform(position, [0, 0.24, 0.82], [1, 1, 0.1]);

  const deckY = useTransform(position, [0, 0.92], [0, -22]);
  const deckScale = useTransform(position, [0, 0.92], [1, 0.97]);
  const deckOpacity = useTransform(position, [0, 0.35, 0.94], [1, 1, 0.22]);

  const dockY = useTransform(position, [0, 0.85], [0, 18]);
  const dockOpacity = useTransform(position, [0, 0.18, 0.65], [1, 1, 0]);

  const parallaxFar = useTransform(position, [0, 0.95], ["0px", "-48px"]);
  const parallaxMid = useTransform(position, [0, 0.95], ["0px", "-78px"]);
  const parallaxNear = useTransform(position, [0, 0.95], ["0px", "-26px"]);
  const stickersOpacity = useTransform(position, [0, 0.3, 0.85], [1, 1, 0.18]);

  return (
    <section ref={hero} className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-art" aria-hidden="true">
        {[0, 1, 2].map((index) => <span key={index} className="hero-spark">✦</span>)}
        <span className="hero-halo hero-halo-outer" />
        <span className="hero-halo hero-halo-inner" />
      </div>

      <motion.div className="hero-copy"
        style={reducedMotion ? undefined : { y: copyY, scale: copyScale, opacity: copyOpacity }}>
        <p className="hero-eyebrow">
          <span className="hero-eyebrow-dot" aria-hidden="true" />
          <Sparkles size={13} aria-hidden="true" />
          <span>本地视觉策展手账</span>
          <span className="hero-eyebrow-sep" aria-hidden="true">·</span>
          <span className="hero-eyebrow-meta">504 图鉴 · 240 动效 · 469 风格</span>
        </p>
        <h1 id="hero-title">我的<span>视觉库</span></h1>
        {reducedMotion
          ? <p>{intro}</p>
          : <BlurText text={intro} className="hero-intro justify-center" trigger="load"
              delay={14} animateBy="letters" distance={8} blur={4} stepDuration={0.26} />}
        <div className="actions">
          <button className="btn primary hero-cta" type="button" onClick={onBrowse}>
            浏览我的视觉库 <ArrowDown size={15} aria-hidden="true" />
          </button>
          <a className="btn hero-secondary" href="#chapter-reference">
            章节导览
          </a>
        </div>
      </motion.div>

      <motion.div id="featured-deck" className="deck" role="group" aria-label="精选视觉技法"
        style={reducedMotion ? undefined : { y: deckY, scale: deckScale, opacity: deckOpacity }}>
        {featured.map((feature) => <FeaturedCard key={feature.id} feature={feature} onOpen={onOpen} />)}
      </motion.div>

      <motion.div className="hero-footer-anchor"
        style={reducedMotion ? undefined : { y: dockY, opacity: dockOpacity }}>
        <nav className="hero-dock" aria-label="章节速览">
          {dockItems.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="hero-dock-item" style={{ "--dock-accent": item.accent }}>
              <span className="hero-dock-dot" aria-hidden="true" />
              <span className="hero-dock-idx">{item.index}</span>
              <span className="hero-dock-label">{item.label}</span>
              <span className="hero-dock-count">{item.count}</span>
            </a>
          ))}
        </nav>
        <a className="hero-scroll-cue" href="#chapter-reference">
          <span>向下滑动探索</span>
          <ChevronDown size={14} aria-hidden="true" />
        </a>
      </motion.div>

      <motion.div className="hero-stickers"
        style={reducedMotion ? undefined : {
          opacity: stickersOpacity,
          "--parallax-far": parallaxFar,
          "--parallax-mid": parallaxMid,
          "--parallax-near": parallaxNear,
        }}>
        <Sticker className="hero-study hero-study-ink" label="按动叠色贴纸">
          <span className="hero-study-face" aria-hidden="true"><i /><i /><i /></span>
        </Sticker>
        <Sticker className="hero-study hero-study-orbit" label="转动星轨贴纸">
          <span className="hero-study-face" aria-hidden="true"><i /><i /></span>
        </Sticker>
        <AnimatedSticker name="false-color-infrared" className="hero-sticker hero-sticker-left" active={animateStickers} />
        <AnimatedSticker name="kaleidoscope" className="hero-sticker hero-sticker-right" active={animateStickers} />
        <Sticker className="hero-study hero-study-dots" label="错开网点贴纸">
          <span className="hero-study-face" aria-hidden="true"><i /><i /></span>
        </Sticker>
        <Sticker className="hero-study hero-study-colors" label="展开色卡贴纸">
          <span className="hero-study-face" aria-hidden="true"><i /><i /><i /></span>
        </Sticker>
      </motion.div>
    </section>
  );
}
