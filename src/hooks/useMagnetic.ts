import { useEffect, useRef, type RefObject } from "react";
import { useReducedMotion } from "./useReducedMotion";

export function useMagnetic<T extends HTMLElement>(
  strength = 4
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900)
    ) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const tx = Math.max(-1, Math.min(1, relX)) * strength;
      const ty = Math.max(-1, Math.min(1, relY)) * strength;
      el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
    };

    const onMouseLeave = () => {
      el.style.transform = "";
    };

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.style.transform = "";
    };
  }, [reducedMotion, strength]);

  return ref;
}
