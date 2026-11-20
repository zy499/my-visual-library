import { useLayoutEffect, useState } from "react";
import { useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

export const showcaseChapters = [
  {
    id: "chapter-reference",
    indexLabel: "01",
    watermark: "ATLAS",
    stat: "504 张视觉图鉴",
    type: "reference",
    backdrop: "--chapter-reference",
    railAccent: "--rail-reference",
    label: "视觉参考",
    sticker: "false-color-infrared",
    title: "收藏好画面",
    emphasis: "拆解它的做法",
    description: "看到一张喜欢的图，把配色、构图和材质记成参考卡。下次做图时，直接翻出来用。",
    note: "留意示例里两种墨色重叠的地方，看看叠出了什么颜色。",
    example: "Riso 套色印刷",
    source: "Atlas",
    key: "risograph",
    quickTags: [
      { label: "印刷与抖动", tag: "数字 · 印刷与抖动" },
      { label: "边缘与特征", tag: "数字 · 边缘与特征" },
      { label: "遮罩与控制", tag: "数字 · 遮罩与控制" },
      { label: "2010 年代", tag: "2010 年代" },
    ],
  },
  {
    id: "chapter-technique",
    indexLabel: "02",
    watermark: "MOTION",
    stat: "240 段动效示范",
    type: "technique",
    backdrop: "--chapter-technique",
    railAccent: "--rail-technique",
    label: "动效与技法",
    sticker: "kaleidoscope",
    title: "从一帧开始",
    emphasis: "看懂一段动效",
    description: "播放示例，观察它怎么起步、加速和停下。觉得节奏合适，就把参数和用法记下来。",
    note: "看箭头在冲出去之前，怎样先往反方向退了一小步。",
    example: "预备动作 · Anticipation",
    source: "Motion Prompt",
    key: "121",
    quickTags: [
      { label: "动态图形", tag: "动态图形 1" },
      { label: "镜头与转场", tag: "镜头与转场 1" },
      { label: "界面组件", tag: "界面组件" },
      { label: "摄影与布光", tag: "摄影与布光" },
    ],
  },
  {
    id: "chapter-style",
    indexLabel: "03",
    watermark: "STYLE",
    stat: "469 套风格 · 4 大赛道",
    type: "style",
    backdrop: "--chapter-style",
    railAccent: "--rail-style",
    label: "风格库",
    sticker: "risograph",
    title: "把想要的风格",
    emphasis: "存成一套配方",
    description: "汇聚 DESIGN.md、UI Pro Max、Prompt Cookbook 与 MOKE 全套风格，按交付物一键套用。",
    note: "试着用暖纸色打底、深墨色写标题，只留一点朱红作强调。",
    example: "纸本编辑部",
    source: "视觉库示例",
    quickTags: [
      { label: "网页与产品 UI", tag: "网页与产品 UI" },
      { label: "平面与海报排版", tag: "平面与海报排版" },
      { label: "摄影与电影镜头", tag: "摄影与电影镜头" },
      { label: "插画与 3D 画风", tag: "插画与 3D 画风" },
    ],
  },
];

export const chapters = [
  { id: "home", label: "首页", sticker: "neon-sign-glow", backdrop: "--paper", railAccent: "--rail-home" },
  ...showcaseChapters,
  { id: "personal-view", label: "我的卡片", sticker: "chromadepth-3d", backdrop: "--canvas", railAccent: "--rail-library" },
];

export function useChapterBackdrop(position) {
  return useTransform(() => {
    const raw = position.get();
    const clamped = Math.max(0, Math.min(chapters.length - 1, raw));
    const index = Math.min(chapters.length - 1, Math.floor(clamped));
    const from = chapters[index].backdrop;
    const to = chapters[index + 1]?.backdrop ?? from;
    const blend = Math.max(0, Math.min(1, (clamped - index - 0.1) / 0.8));
    // Smoothstep easing near chapter centers for calm Apple-like color glides.
    const weight = blend * blend * (3 - 2 * blend) * 100;
    return `color-mix(in oklab, var(${from}), var(${to}) ${weight}%)`;
  });
}

export function useChapterScroll() {
  const reducedMotion = useReducedMotion();
  const position = useMotionValue(0);
  const dampedPosition = useSpring(position, {
    stiffness: 155,
    damping: 28,
    mass: 0.42,
    restDelta: 0.0005,
  });
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    const sections = chapters.map(({ id }) => document.getElementById(id));
    const header = document.querySelector(".top");
    let frame = 0;
    let stops;
    let initialized = false;

    function update() {
      frame = 0;
      const y = scrollY;
      const index = Math.max(0, stops.findLastIndex((stop) => y >= stop));
      const next = stops[index + 1];
      const span = next === undefined ? 1 : Math.max(1, next - stops[index]);
      const fraction = next === undefined ? 0 : (y - stops[index]) / span;
      const progress = Math.max(0, Math.min(chapters.length - 1, index + Math.max(0, fraction)));
      if (!initialized) {
        initialized = true;
        position.jump(progress);
        dampedPosition.jump(progress);
      } else {
        position.set(progress);
      }
      setActive(Math.round(progress));
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    function measure() {
      const y = scrollY;
      const offset = header.offsetHeight;
      stops = sections.map((section) => Math.round(section.getBoundingClientRect().top + y - offset));
      stops[stops.length - 1] = Math.min(stops.at(-1), document.documentElement.scrollHeight - innerHeight);
      schedule();
    }

    // Restore fragments after React creates the anchor elements.
    const deepLink = document.getElementById(location.hash.slice(1));
    if (deepLink && scrollY < 2) deepLink.scrollIntoView({ behavior: "instant" });
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    [header, ...sections].forEach((section) => observer.observe(section));
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [position, dampedPosition]);

  return {
    active,
    position,
    smoothPosition: reducedMotion ? position : dampedPosition,
  };
}
