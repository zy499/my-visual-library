import { useRef } from "react";
import { useReducedMotion } from "motion/react";
import { asset } from "../library-data.js";

const replayLabels = {
  "false-color-infrared": "重播相机快门",
  kaleidoscope: "转动万花筒",
};

export function Sticker({ className, active, label, children }) {
  const reducedMotion = useReducedMotion();
  const root = useRef(null);
  const replayCount = useRef(0);
  const interactive = label && !reducedMotion;
  const Element = interactive ? "button" : "span";

  function replay() {
    const sticker = root.current;
    if (!sticker) return;
    const request = ++replayCount.current;
    delete sticker.dataset.stickerReplay;
    void sticker.offsetWidth;
    sticker.dataset.stickerReplay = "";
    const animations = sticker.getAnimations({ subtree: true });
    for (const animation of animations) {
      animation.currentTime = animation.effect?.getTiming?.().delay || 0;
      animation.play();
    }
    Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (request === replayCount.current) delete sticker.dataset.stickerReplay;
    });
  }

  return (
    <Element ref={root} className={`animated-sticker ${className}`} data-sticker-active={active || undefined}
      {...(interactive ? {
        type: "button",
        "aria-label": label,
        onClick: replay,
        onPointerEnter: (event) => { if (event.pointerType === "mouse") replay(); },
      } : { "aria-hidden": true })}>
      {children}
    </Element>
  );
}

export default function AnimatedSticker({ name, className, active }) {
  const source = asset(`贴纸/${name}.webp`);
  return (
    <Sticker className={className} active={active} label={replayLabels[name]}>
      <img className="sticker-image" src={source} alt="" width="500" height="500" draggable="false" />
      {name === "false-color-infrared" && <span className="sticker-flash" />}
      {name === "kaleidoscope" && (
        <span className="sticker-lens">
          <img src={source} alt="" width="500" height="500" draggable="false" />
        </span>
      )}
    </Sticker>
  );
}
