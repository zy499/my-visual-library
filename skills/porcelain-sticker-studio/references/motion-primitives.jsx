/**
 * Porcelain Sticker Studio — Reference React 19 + Motion/React + Radix Primitives
 * Copy and adapt directly into new projects to match 95%+ interaction physics.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Monitor, MoonStar, Sun } from "lucide-react";

/* 1. Damped Spring Chapter Scroll + Smoothstep OKLab Backdrop Wash */
export function useChapterScroll(chapterIds) {
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
    const sections = chapterIds.map((id) => document.getElementById(id)).filter(Boolean);
    const header = document.querySelector(".top");
    let frame = 0;
    let stops = [];
    let initialized = false;

    function update() {
      frame = 0;
      const y = window.scrollY;
      const index = Math.max(0, stops.findLastIndex((stop) => y >= stop));
      const next = stops[index + 1];
      const span = next === undefined ? 1 : Math.max(1, next - stops[index]);
      const fraction = next === undefined ? 0 : (y - stops[index]) / span;
      const progress = Math.max(0, Math.min(sections.length - 1, index + Math.max(0, fraction)));
      if (!initialized) {
        initialized = true;
        position.jump(progress);
        dampedPosition.jump(progress);
      } else {
        position.set(progress);
      }
      setActive(Math.round(progress));
    }

    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    function measure() {
      const y = window.scrollY;
      const offset = header?.offsetHeight || 0;
      stops = sections.map((el) => Math.round(el.getBoundingClientRect().top + y - offset));
      if (stops.length) stops[stops.length - 1] = Math.min(stops.at(-1), document.documentElement.scrollHeight - window.innerHeight);
      schedule();
    }

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    [header, ...sections].filter(Boolean).forEach((el) => observer.observe(el));
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [chapterIds, position, dampedPosition]);

  return { active, position, smoothPosition: reducedMotion ? position : dampedPosition };
}

export function useChapterBackdrop(position, backdropVars) {
  return useTransform(() => {
    const clamped = Math.max(0, Math.min(backdropVars.length - 1, position.get()));
    const index = Math.min(backdropVars.length - 1, Math.floor(clamped));
    const from = backdropVars[index];
    const to = backdropVars[index + 1] ?? from;
    const blend = Math.max(0, Math.min(1, (clamped - index - 0.1) / 0.8));
    const weight = blend * blend * (3 - 2 * blend) * 100; // smoothstep
    return `color-mix(in oklab, var(${from}), var(${to}) ${weight}%)`;
  });
}

/* 2. 3D Pointer Tilt + Specular Glare Hook */
export function usePointerTilt(strength = 3.5) {
  const reduced = useReducedMotion();
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function onPointerMove(event) {
    if (reduced || event.pointerType !== "mouse") return;
    const el = event.currentTarget;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      el.style.setProperty("--tilt-y", `${(x - 0.5) * strength * 2}deg`);
      el.style.setProperty("--tilt-x", `${(0.5 - y) * strength * 2}deg`);
      el.style.setProperty("--light-x", `${x * 100}%`);
      el.style.setProperty("--light-y", `${y * 100}%`);
      el.dataset.pointer = "tracking";
    });
  }

  function reset(event) {
    cancelAnimationFrame(frame.current);
    const el = event.currentTarget;
    delete el.dataset.pointer;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  }

  return { onPointerMove, onPointerLeave: reset, onPointerCancel: reset };
}

/* 3. OS-Following 3-Way Theme Switcher (Light / System / Dark) */
const THEME_OPTIONS = [
  { id: "day", label: "明亮模式", Icon: Sun },
  { id: "system", label: "跟随系统", Icon: Monitor },
  { id: "night", label: "暗夜模式", Icon: MoonStar },
];

export function useSystemTheme(storageKey = "app-theme-mode") {
  const [mode, setMode] = useState(() => {
    try {
      const s = localStorage.getItem(storageKey);
      return s === "day" || s === "night" || s === "system" ? s : "system";
    } catch { return "system"; }
  });
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches)
  );
  const night = mode === "night" || (mode === "system" && systemDark);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = night ? "night" : "day";
    try { localStorage.setItem(storageKey, mode); } catch { /* ignore */ }
  }, [night, mode, storageKey]);

  return { mode, setMode, night };
}

export function ThemeSwitcher({ mode, onChange }) {
  return (
    <div className="theme-switcher" role="radiogroup" aria-label="外观模式">
      {THEME_OPTIONS.map(({ id, label, Icon }) => {
        const selected = mode === id;
        return (
          <button key={id} type="button" role="radio" aria-checked={selected}
            className={`theme-opt ${selected ? "is-active" : ""}`} title={label} aria-label={label}
            onClick={() => onChange(id)}>
            {selected && <motion.span className="theme-opt-pill" layoutId="theme-mode-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <Icon size={14} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

/* 4. Non-Scroll-Locking Select (Zero Scrollbar Flicker!) */
export function NonLockingSelect({ id, label, value, options, onChange }) {
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) || options[0];

  return (
    <Popover.Root modal={false} open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button ref={trigger} id={id} type="button" className="field-select"
          aria-label={label} aria-haspopup="listbox" aria-expanded={open}>
          <span className="field-select-value">{current?.label ?? ""}</span>
          <span className="field-select-chevron" aria-hidden="true"><ChevronDown size={16} /></span>
        </button>
      </Popover.Trigger>
      <Popover.Portal container={trigger.current?.closest("dialog") ?? undefined}>
        <Popover.Content className="field-options" align="start" sideOffset={7} collisionPadding={12}
          onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="field-options-list" role="listbox" aria-label={label}>
            {options.map((option) => {
              const checked = option.value === value;
              return (
                <button key={option.value} type="button" role="option" aria-selected={checked}
                  className="field-option" data-state={checked ? "checked" : "unchecked"}
                  onClick={() => { onChange(option.value); setOpen(false); trigger.current?.focus(); }}>
                  <span>{option.label}</span>
                  {checked && <Check size={14} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* 5. Layered Double-Card Squircle Brand Logo */
export function BrandLogo() {
  return (
    <span className="brand-logo" aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="vl-back" x1="8" y1="4" x2="36" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFE082" /><stop offset="55%" stopColor="#FFB156" /><stop offset="100%" stopColor="#FF6F7D" />
          </linearGradient>
          <linearGradient id="vl-front" x1="4" y1="6" x2="32" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3AA6FF" /><stop offset="52%" stopColor="#0071E3" /><stop offset="100%" stopColor="#5856D6" />
          </linearGradient>
        </defs>
        <g className="brand-logo-back">
          <rect x="11" y="6" width="23" height="23" rx="7.5" fill="url(#vl-back)" stroke="var(--logo-rim)" strokeWidth="1.6" />
        </g>
        <g className="brand-logo-front">
          <rect x="5" y="9" width="24" height="24" rx="8" fill="url(#vl-front)" stroke="var(--logo-rim)" strokeWidth="1.8" />
          <path className="brand-logo-spark" d="M17 14.6L18.45 18.55L22.4 20L18.45 21.45L17 25.4L15.55 21.45L11.6 20L15.55 18.55L17 14.6Z" fill="#FFFFFF" />
          <circle cx="22.8" cy="15.2" r="1.5" fill="#FFE082" />
        </g>
      </svg>
    </span>
  );
}
