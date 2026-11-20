import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

export function usePointerTilt(strength = 4) {
  const reduced = useReducedMotion();
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function move(event) {
    if (reduced || event.pointerType !== "mouse") return;
    const element = event.currentTarget;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      element.style.setProperty("--tilt-y", `${(x - .5) * strength * 2}deg`);
      element.style.setProperty("--tilt-x", `${(.5 - y) * strength * 2}deg`);
      element.style.setProperty("--light-x", `${x * 100}%`);
      element.style.setProperty("--light-y", `${y * 100}%`);
      element.dataset.pointer = "tracking";
    });
  }

  function reset(event) {
    cancelAnimationFrame(frame.current);
    const element = event.currentTarget;
    delete element.dataset.pointer;
    element.style.setProperty("--tilt-x", "0deg");
    element.style.setProperty("--tilt-y", "0deg");
  }

  return { onPointerMove: move, onPointerLeave: reset, onPointerCancel: reset };
}
