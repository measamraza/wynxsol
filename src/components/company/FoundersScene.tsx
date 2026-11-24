import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WYNXSOL_CONFIG } from "../../config/wynxsol";
import { useReducedMotion } from "../../hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

export function FoundersScene() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;

    const ctx = gsap.context(() => {
      const frames = section.querySelectorAll(".founder-portrait-frame");
      const metaBlocks = section.querySelectorAll(".founder-meta");

      if (frames.length) {
        gsap.fromTo(
          frames,
          { clipPath: "inset(100% 0% 0% 0%)", opacity: 0.4 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "clipPath",
            scrollTrigger: {
              trigger: ".founders-gallery",
              start: "top 82%",
              once: true,
            },
          }
        );
      }

      if (metaBlocks.length) {
        gsap.fromTo(
          metaBlocks,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            stagger: 0.1,
            delay: 0.15,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: ".founders-gallery",
              start: "top 82%",
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="founders-scene"
      id="scene-founders"
      data-scene-index="07 | 08"
      aria-labelledby="founders-heading"
    >
      <div className="container">
        <div className="founders-header-row">
          <div>
            <span className="eyebrow-editorial">07 // The Founders</span>
            <h2 className="serif-display" id="founders-heading" style={{ fontSize: "var(--text-3xl)" }}>
              LEADERSHIP.
            </h2>
          </div>
          <div className="founders-header-aside">
            <span className="founders-region-tag">Pakistan &amp; International Delivery</span>
            <p className="body-copy" style={{ fontSize: "13px", maxWidth: "36ch" }}>
              Engineering leadership driving AI systems, computer vision, and bespoke software
              infrastructure.
            </p>
          </div>
        </div>

        <div className="founders-gallery">
          {WYNXSOL_CONFIG.founders.map((founder) => {
            const imgFailed = Boolean(failedImages[founder.id]);
            const photoVars = {
              "--photo-pos": founder.photoPosition,
              "--photo-scale": String(founder.photoScale),
            } as CSSProperties;

            return (
              <article key={founder.id} className="founder-card">
                <div className="founder-portrait-frame">
                  {!imgFailed ? (
                    <img
                      src={founder.photoPath}
                      alt={`${founder.name}, ${founder.role} at Wynx Solutions`}
                      className="founder-portrait-img"
                      style={photoVars}
                      loading="lazy"
                      decoding="async"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [founder.id]: true,
                        }))
                      }
                    />
                  ) : (
                    <div className="founder-portrait-fallback" aria-hidden="true">
                      <span>{founder.initials}</span>
                    </div>
                  )}
                  <span className="founder-portrait-index" aria-hidden="true">
                    {founder.index}
                  </span>
                </div>

                <div className="founder-meta">
                  <div className="founder-role">{founder.role}</div>
                  <h3 className="serif-display founder-name">{founder.name}</h3>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
