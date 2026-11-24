import { useCallback, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WYNXSOL_CONFIG } from "../../config/wynxsol";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { OpeningLogo3DCanvas } from "./OpeningLogo3DCanvas";

gsap.registerPlugin(ScrollTrigger);

export function OpeningScene() {
  const reducedMotion = useReducedMotion();
  const [webglFailed, setWebglFailed] = useState(false);

  const wrapRef = useRef<HTMLElement | null>(null);
  const diagRef = useRef<HTMLDivElement | null>(null);
  const footerRowRef = useRef<HTMLDivElement | null>(null);
  const titleWrapRef = useRef<HTMLDivElement | null>(null);
  const titleHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const fallbackFrameRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const captionLinesRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);

  const handleWebGLFallback = useCallback(() => {
    setWebglFailed(true);
  }, []);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    if (reducedMotion) {
      progressRef.current = 0.62;
      return;
    }

    const ctx = gsap.context(() => {
      // Phase 1 entrance on initial load (immediate visibility, zero splash lock)
      gsap.fromTo(
        ".opening-intro-reveal",
        { yPercent: 105, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.72,
          stagger: 0.08,
          ease: "power3.out",
          clearProps: "transform",
        }
      );

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.35,
          onUpdate: (self) => {
            progressRef.current = self.progress;
            if (diagRef.current) {
              const angle = 134 + self.progress * 42;
              diagRef.current.style.setProperty("--diag-angle", `${angle.toFixed(1)}deg`);
            }
          },
        },
      });

      // Phase 2: Footer cue clears early while "Wynx Solutions" stays visible until 3D halves enter
      tl.to(
        footerRowRef.current,
        {
          opacity: 0,
          y: -14,
          duration: 0.14,
          ease: "power2.out",
        },
        0
      )
        .to(
          titleWrapRef.current,
          {
            scale: 0.88,
            opacity: 0,
            filter: "blur(7px)",
            duration: 0.3,
            ease: "power2.inOut",
          },
          0.14
        )
        .to(
          titleHeadingRef.current,
          {
            letterSpacing: "0.01em",
            duration: 0.3,
            ease: "power2.inOut",
          },
          0.14
        );

      if (fallbackFrameRef.current) {
        tl.fromTo(
          fallbackFrameRef.current,
          { opacity: 0, clipPath: "inset(0% 24% 0% 24%)", scale: 0.92 },
          {
            opacity: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            scale: 1,
            duration: 0.36,
            ease: "power3.out",
          },
          0.2
        ).to(
          fallbackFrameRef.current,
          { opacity: 0, y: -28, duration: 0.18, ease: "power2.in" },
          0.8
        );
      }

      // Reveal quiet statement beneath the settled 3D logo (complete before 58%)
      tl.fromTo(
        captionRef.current,
        { opacity: 0, y: 0 },
        { opacity: 1, duration: 0.14, ease: "none" },
        0.4
      )
        .fromTo(
          captionLinesRef.current?.querySelectorAll(".opening-caption-line") || [],
          { yPercent: 110 },
          { yPercent: 0, duration: 0.16, stagger: 0.04, ease: "power3.out" },
          0.4
        )
        // Dissolve cleanly into Scene 02 without orphaned clipped text or dead black gap
        .to(
          captionRef.current,
          {
            opacity: 0,
            y: -28,
            duration: 0.14,
            ease: "power2.in",
          },
          0.86
        );
    }, wrapRef);

    return () => {
      ctx.revert();
    };
  }, [reducedMotion, webglFailed]);

  return (
    <section
      ref={wrapRef}
      className="opening-wrap"
      id="company"
      data-scene-index="01 | 08"
      aria-labelledby="opening-heading"
      style={reducedMotion ? { height: "auto", minHeight: "100vh" } : undefined}
    >
      <span id="scene-opening" style={{ position: "absolute", top: 0, left: 0 }} aria-hidden="true" />
      <div className="opening-pin">
        <div ref={diagRef} className="opening-diag-hairline" aria-hidden="true" />

        <div className="opening-stage" id="opening-stage">
          <span className="eyebrow-editorial opening-kicker" id="opening-kicker">
            01 // Engineering Studio
          </span>

          <div className="opening-arena">
            {!reducedMotion && (
              <div ref={titleWrapRef} className="opening-title-wrap">
                <h1 className="opening-wynxsol-title" ref={titleHeadingRef} id="opening-heading">
                  <span className="line-mask opening-title-mask">
                    <span className="opening-intro-reveal opening-title-text">
                      Wynx Solutions
                    </span>
                  </span>
                </h1>
              </div>
            )}

            {!webglFailed ? (
              <div className="opening-logo-3d-layer" id="opening-logo-stage">
                <OpeningLogo3DCanvas
                  progressRef={progressRef}
                  reducedMotion={reducedMotion}
                  onWebGLFallback={handleWebGLFallback}
                />
              </div>
            ) : (
              <div
                ref={fallbackFrameRef}
                className="opening-logo-frame opening-logo-fallback-frame"
                id="opening-logo-stage"
                style={reducedMotion ? { opacity: 1, clipPath: "none", transform: "none" } : undefined}
              >
                <img
                  src={WYNXSOL_CONFIG.logoImagePath}
                  alt="Wynx Solutions official metallic WS emblem"
                  className="opening-logo-img"
                  decoding="async"
                />
              </div>
            )}

            <div
              ref={captionRef}
              className="opening-logo-caption"
              style={reducedMotion ? { opacity: 1 } : undefined}
            >
              <div ref={captionLinesRef} className="opening-caption-stack">
                <span className="line-mask">
                  <span className="opening-caption-line opening-logo-wordmark">
                    WYNX SOLUTIONS
                  </span>
                </span>
                <span className="line-mask">
                  <span className="opening-caption-line opening-logo-subhead">
                    WE BUILD WHAT COMES NEXT.
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div
            ref={footerRowRef}
            className="opening-footer-row"
            id="opening-footer-row"
            style={reducedMotion ? { opacity: 0.9 } : undefined}
          >
            <p className="opening-sub">
              <span className="line-mask">
                <span className="opening-intro-reveal">
                  Intelligence, software and systems engineered to move businesses forward.
                </span>
              </span>
            </p>
            <span className="opening-scroll-cue" id="opening-scroll-cue">
              Scroll to discover &darr;
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
