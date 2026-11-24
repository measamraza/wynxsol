import { useCallback, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PHILOSOPHY_PILLARS } from "../../data/company";
import { useNavigation } from "../../context/NavigationContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

export function PhilosophyScene() {
  const reducedMotion = useReducedMotion();
  const { scrollToHash } = useNavigation();
  const [activeIdx, setActiveIdx] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;

    const ctx = gsap.context(() => {
      const items = section.querySelectorAll<HTMLElement>(".phil-item");
      items.forEach((item, idx) => {
        ScrollTrigger.create({
          trigger: item,
          start: "top 62%",
          end: "bottom 38%",
          onEnter: () => setActiveIdx(idx),
          onEnterBack: () => setActiveIdx(idx),
        });
      });

      ScrollTrigger.create({
        trigger: section,
        start: "top 60%",
        end: "bottom 55%",
        scrub: true,
        onUpdate: (self) => {
          if (progressBarRef.current) {
            progressBarRef.current.style.height = `${Math.max(12, Math.min(100, self.progress * 100)).toFixed(1)}%`;
          }
        },
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [reducedMotion]);

  const handleSelectPillar = useCallback(
    (id: string, idx: number) => {
      setActiveIdx(idx);
      scrollToHash(`#phil-pillar-${id}`);
    },
    [scrollToHash]
  );

  return (
    <section
      ref={sectionRef}
      className="philosophy-scene"
      id="scene-philosophy"
      data-scene-index="03 | 08"
      aria-labelledby="phil-heading"
    >
      <div className="container">
        <div className="philosophy-grid">
          <div className="philosophy-aside">
            <span className="eyebrow-editorial" id="phil-heading">
              03 // Our Philosophy
            </span>
            <h2 className="serif-display philosophy-aside-title">
              THREE PILLARS OF QUIET PRECISION.
            </h2>
            <p className="body-copy" style={{ fontSize: "14px", maxWidth: "36ch", marginTop: "1rem" }}>
              Every engagement starts with operational clarity and concludes with resilient software
              working silently in production.
            </p>

            <div className="phil-aside-nav">
              <div className="phil-vertical-track" aria-hidden="true">
                <div ref={progressBarRef} className="phil-vertical-fill" />
              </div>
              <div className="phil-pillar-nav" role="tablist" aria-label="Philosophy principles">
                {PHILOSOPHY_PILLARS.map((pillar, idx) => (
                  <button
                    key={pillar.id}
                    type="button"
                    role="tab"
                    aria-selected={activeIdx === idx}
                    className={`phil-dot-btn${activeIdx === idx ? " is-active" : ""}`}
                    onClick={() => handleSelectPillar(pillar.id, idx)}
                  >
                    {pillar.tabLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="phil-stream">
            {PHILOSOPHY_PILLARS.map((pillar, pIdx) => {
              const isActive = activeIdx === pIdx;
              return (
                <article
                  key={pillar.id}
                  id={`phil-pillar-${pillar.id}`}
                  className={`phil-item${isActive ? " is-active" : ""}`}
                >
                  <span className="phil-item__index">0{pIdx + 1} // PRINCIPLE</span>
                  <h3 className={`phil-word${pillar.accent ? " text-chrome" : ""}`}>
                    {pillar.word}
                  </h3>
                  <p className="lead-copy">{pillar.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
