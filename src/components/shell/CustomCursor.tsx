import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export function CustomCursor() {
  const reducedMotion = useReducedMotion();
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reducedMotion || coarse || window.innerWidth <= 900) {
      return;
    }

    let dx = -120;
    let dy = -120;
    let rx = -120;
    let ry = -120;
    let tx = -120;
    let ty = -120;
    let rafId = 0;

    const onMouseMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      dot.classList.add("is-visible");
      ring.classList.add("is-visible");
    };

    const onTouchStart = () => {
      dot.classList.remove("is-visible");
      ring.classList.remove("is-visible");
    };

    const onMouseLeave = () => {
      dot.classList.remove("is-visible");
      ring.classList.remove("is-visible");
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (
        target &&
        target.closest(
          "a, button, .cap-node, .process-row, .sim-table-island, .founder-card, .solution-layer-card"
        )
      ) {
        ring.classList.add("is-hovering");
      } else {
        ring.classList.remove("is-hovering");
      }
    };

    const loop = () => {
      dx += (tx - dx) * 0.55;
      dy += (ty - dy) * 0.55;
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      dot.style.transform = `translate3d(${dx - 3}px, ${dy - 3}px, 0)`;
      const rHalf = ring.classList.contains("is-hovering") ? 22 : 14;
      ring.style.transform = `translate3d(${rx - rHalf}px, ${ry - rHalf}px, 0)`;
      rafId = window.requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseover", onMouseOver);
    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseover", onMouseOver);
    };
  }, [reducedMotion]);

  return (
    <>
      <div ref={dotRef} className="wynx-cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="wynx-cursor-ring" aria-hidden="true" />
    </>
  );
}
