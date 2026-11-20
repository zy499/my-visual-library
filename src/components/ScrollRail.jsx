import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useSpring, useTransform, useVelocity } from "motion/react";
import { asset } from "../library-data.js";
import { chapters } from "../chapters.js";

const radius = 760;
const center = 57;
const arcX = (y) => center - radius + Math.sqrt(radius ** 2 - y ** 2);
const ticks = Array.from({ length: 47 }, (_, index) => {
  const y = (index - 23) * 17;
  return { x: arcX(y) - 6, y, angle: -Math.asin(y / radius), major: index % 4 === 0 };
});

const mascotQuips = [
  "1,200+ 张灵感随时待命 ✨",
  "跟着我往下逛图鉴吧～",
  "试试右上角夜间模式 🌙",
  "点卡片可放大看细节 🔍",
  "滚慢点，我在记笔记 ✏️",
];

function Sticker({ name, size, className }) {
  return <img className={className} src={asset(`贴纸/${name}.webp`)} width={size} height={size} alt="" draggable="false" />;
}

export default function ScrollRail({ active, position }) {
  const rows = useRef([]);
  const reducedMotion = useReducedMotion();
  const [hopCount, setHopCount] = useState(0);
  const [quip, setQuip] = useState("");
  const [dragging, setDragging] = useState(false);
  const quipIndex = useRef(0);
  const quipTimer = useRef(null);
  const lastActive = useRef(active);
  const dragState = useRef(null);

  const velocity = useVelocity(position);
  const smoothVelocity = useSpring(velocity, { stiffness: 180, damping: 22, mass: 0.4 });
  const mascotTilt = useTransform(smoothVelocity, [-3.5, 0, 3.5], [-18, 0, 18]);
  const mascotShiftY = useTransform(smoothVelocity, [-3.5, 0, 3.5], [-4, 0, 4]);

  useEffect(() => {
    if (lastActive.current !== active) {
      lastActive.current = active;
      setHopCount((count) => count + 1);
    }
  }, [active]);

  useEffect(() => () => clearTimeout(quipTimer.current), []);

  function pokeMascot() {
    setHopCount((count) => count + 1);
    const next = mascotQuips[quipIndex.current % mascotQuips.length];
    quipIndex.current += 1;
    setQuip(next);
    clearTimeout(quipTimer.current);
    quipTimer.current = setTimeout(() => setQuip(""), 2600);
  }

  function startRailDrag(event, isMascot = false) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const railSpan = Math.max(240, Math.min(134, window.innerHeight * 0.16) * (chapters.length - 1));
    dragState.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollY: window.scrollY,
      scale: maxScroll / railSpan,
      moved: false,
      isMascot,
    };
    setDragging(true);
  }

  function moveRailDrag(event) {
    const st = dragState.current;
    if (!st || st.pointerId !== event.pointerId) return;
    const dy = event.clientY - st.startY;
    if (Math.abs(dy) > 4) st.moved = true;
    if (!st.moved) return;
    const nextTop = Math.max(0, Math.min(
      document.documentElement.scrollHeight - window.innerHeight,
      st.startScrollY + dy * st.scale,
    ));
    window.scrollTo({ top: nextTop, behavior: "instant" });
  }

  function endRailDrag(event) {
    const st = dragState.current;
    if (!st || st.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const wasClickOnMascot = st.isMascot && !st.moved;
    dragState.current = null;
    setDragging(false);
    if (wasClickOnMascot) pokeMascot();
  }

  const draw = useCallback((value) => {
    const progress = Math.min(chapters.length - 1, Math.max(0, value));
    const spacing = Math.min(134, innerHeight * 0.16);
    rows.current.forEach((row, rowIndex) => {
      if (!row) return;
      const delta = rowIndex - progress;
      const distance = Math.abs(delta);
      const y = Math.max(-radius + 1, Math.min(radius - 1, delta * spacing));
      const emphasis = Math.max(0, 1 - distance * 1.15);
      row.style.setProperty("--chapter-x", `${arcX(y)}px`);
      row.style.setProperty("--chapter-y", `${y}px`);
      row.style.setProperty("--chapter-angle", `${Math.asin(y / radius) * 0.42}rad`);
      row.style.setProperty("--chapter-opacity", Math.max(0.24, 1 - distance * 0.34));
      row.style.setProperty("--chapter-emphasis", `${emphasis * 100}%`);
    });
  }, []);

  useMotionValueEvent(position, "change", (value) => { if (!reducedMotion) draw(value); });
  useEffect(() => {
    const resize = () => draw(reducedMotion ? active : position.get());
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [active, draw, position, reducedMotion]);

  const activeAccent = chapters[active]?.railAccent || "--rail-reference";

  return (
    <nav className={`scroll-rail ${dragging ? "is-dragging" : ""}`} aria-label="滚动导览"
      style={{ "--rail-accent": `var(${activeAccent})` }}>
      <span className="scroll-rail-curve" aria-hidden="true" />
      <span className="scroll-rail-curve scroll-rail-curve-lit" aria-hidden="true" />
      <span className="scroll-rail-drag-strip"
        role="slider"
        tabIndex={-1}
        aria-label="上下拖动导览轨道滚动页面"
        aria-valuemin={0}
        aria-valuemax={chapters.length - 1}
        aria-valuenow={active}
        title="按住上下拖动可快速滚动页面"
        onPointerDown={(e) => startRailDrag(e, false)}
        onPointerMove={moveRailDrag}
        onPointerUp={endRailDrag}
        onPointerCancel={endRailDrag}
      />
      <span className="scroll-rail-ticks" aria-hidden="true">
        {ticks.map(({ x, y, angle, major }) => (
          <i key={y} className={major ? "major" : undefined}
            style={{ left: x, top: `calc(50% + ${y}px)`, rotate: `${angle}rad` }} />
        ))}
      </span>

      <div className="scroll-rail-marker">
        <motion.button
          type="button"
          className="scroll-rail-mascot-btn"
          aria-label="互动小镜头精灵（点击打招呼，按住上下拖动可滚动页面）"
          title="点我打招呼 · 按住上下拖动可滚动页面"
          onPointerDown={(e) => startRailDrag(e, true)}
          onPointerMove={moveRailDrag}
          onPointerUp={endRailDrag}
          onPointerCancel={endRailDrag}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pokeMascot(); } }}
          style={reducedMotion ? undefined : { rotate: mascotTilt, y: mascotShiftY }}
          whileHover={reducedMotion || dragging ? undefined : { scale: 1.12 }}
          whileTap={reducedMotion ? undefined : { scale: 0.94 }}
        >
          <span className="scroll-rail-mascot-orbit" aria-hidden="true" />
          <span className="scroll-rail-mascot-stage" aria-hidden="true">
            <span className="scroll-rail-mascot-shadow" />
            <motion.span
              key={hopCount}
              className="scroll-rail-mascot-bob"
              initial={reducedMotion || hopCount === 0 ? false : { scaleY: 0.72, scaleX: 1.22, y: 4, rotate: -10 }}
              animate={{ scaleY: 1, scaleX: 1, y: 0, rotate: 0 }}
              transition={{ type: "spring", stiffness: 520, damping: 14 }}
            >
              <span className="scroll-rail-mascot-actor">
                <img
                  className="scroll-rail-mascot-img"
                  src={asset("贴纸/mascot-lens.webp")}
                  width="46"
                  height="46"
                  alt=""
                  draggable="false"
                />
                <span className="mascot-star-glint" />
                <span className="mascot-lens-glint" />
              </span>
            </motion.span>
            <span className="mascot-spark mascot-spark-1">✦</span>
            <span className="mascot-spark mascot-spark-2">✦</span>
          </span>
          {hopCount > 0 && !reducedMotion && (
            <motion.span
              key={`pulse-${hopCount}`}
              className="scroll-rail-mascot-pulse"
              aria-hidden="true"
              initial={{ scale: 0.72, opacity: 0.75 }}
              animate={{ scale: 1.72, opacity: 0 }}
              transition={{ duration: 0.56, ease: "easeOut" }}
            />
          )}
        </motion.button>

        <AnimatePresence>
          {quip && (
            <motion.span
              className="scroll-rail-quip"
              role="status"
              initial={{ opacity: 0, x: -8, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -6, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              {quip}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <ol>
        {chapters.map((chapter, index) => (
          <li key={chapter.id} ref={(node) => { rows.current[index] = node; }}
            style={{ "--node-accent": `var(${chapter.railAccent})` }}>
            <a href={`#${chapter.id}`} aria-current={active === index ? "location" : undefined}>
              <Sticker name={chapter.sticker} size={22} />
              <span>{chapter.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
