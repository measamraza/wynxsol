import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useWhatsApp } from "../../context/WhatsAppContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { SmartLink } from "../shell/SmartLink";
import { LiquidChromeCanvas } from "./LiquidChromeCanvas";

gsap.registerPlugin(ScrollTrigger);

export function WorkScene() {
  const reducedMotion = useReducedMotion();
  const { openWhatsApp } = useWhatsApp();
  const sectionRef = useRef<HTMLElement | null>(null);
  const leftLineRef = useRef<HTMLSpanElement | null>(null);
  const rightLineRef = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;

    const ctx = gsap.context(() => {
      if (leftLineRef.current) {
        gsap.fromTo(
          leftLineRef.current,
          { x: -32, opacity: 0.45 },
          {
            x: 16,
            opacity: 1,
            scrollTrigger: {
              trigger: section,
              start: "top 88%",
              end: "center center",
              scrub: true,
            },
          }
        );
      }

      if (rightLineRef.current) {
        gsap.fromTo(
          rightLineRef.current,
          { x: 32, opacity: 0.45 },
          {
            x: -16,
            opacity: 1,
            scrollTrigger: {
              trigger: section,
              start: "top 88%",
              end: "center center",
              scrub: true,
            },
          }
        );
      }

      const cards = section.querySelectorAll(".work-editorial-piece");
      if (cards.length) {
        gsap.fromTo(
          cards,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: ".work-track",
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
      className="work-scene"
      id="scene-work"
      data-scene-index="05 | 08"
      aria-labelledby="work-heading"
    >
      <div className="container">
        <div className="work-create-hero">
          <LiquidChromeCanvas triggerRef={sectionRef} reducedMotion={reducedMotion} />

          <div className="work-create-overlay">
            <div className="work-create-top">
              <span className="eyebrow-editorial">05 // Conceptual Demonstrations</span>
              <h2 className="serif-display work-create-headline" id="work-heading">
                <span ref={leftLineRef} className="work-create-line work-create-line--left">
                  WHAT WE
                </span>
                <span
                  ref={rightLineRef}
                  className="work-create-line work-create-line--right text-chrome"
                >
                  CREATE.
                </span>
              </h2>
            </div>

            <div className="work-create-bottom">
              <p className="body-copy" style={{ fontSize: "13px", maxWidth: "40ch" }}>
                Clearly labelled conceptual engineering demonstrations built by Wynx Solutions—zero
                fabricated client metrics or fake deployments.
              </p>
              <span className="work-chrome-telemetry">
                SCULPTED METALLIC FORM // INTERACTIVE STUDIO FIELD
              </span>
            </div>
          </div>
        </div>

        <div className="work-track">
          <article className="work-editorial-piece">
            <div className="work-visual-frame">
              <span className="work-concept-tag is-flagship">
                CONCEPT 01 // FLAGSHIP PRODUCT
              </span>
              <div className="work-mini-floor" aria-hidden="true">
                <div className="work-mini-node">T-01 Attended</div>
                <div className="work-mini-node is-alert">T-04 15m Alert</div>
                <div className="work-mini-node">T-03 Ready</div>
                <div className="work-mini-node is-cleaning">T-06 Cleaning</div>
              </div>
              <h3 className="serif-display" style={{ fontSize: "1.8rem" }}>
                Restaurant Intelligence
              </h3>
            </div>
            <div>
              <p className="body-copy" style={{ fontSize: "14px", marginBottom: "1.1rem" }}>
                Computer vision concept turning authorised dining camera feeds into live table status,
                15-minute waiter alerts and cleaning coordination.
              </p>
              <SmartLink to="/restaurant-ai" className="btn btn--chrome btn--sm">
                Enter Interactive Simulation &rarr;
              </SmartLink>
            </div>
          </article>

          <article className="work-editorial-piece">
            <div className="work-visual-frame">
              <span className="work-concept-tag">
                CONCEPT 02 // AGENTIC WORKFLOW
              </span>
              <div className="work-mini-pipeline" aria-hidden="true">
                <span>Event Trigger</span>
                <span>&rarr;</span>
                <span>Agent Plan</span>
                <span>&rarr;</span>
                <span>Verified Output</span>
              </div>
              <h3 className="serif-display" style={{ fontSize: "1.8rem" }}>
                Autonomous Pipeline Engine
              </h3>
            </div>
            <div>
              <p className="body-copy" style={{ fontSize: "14px", marginBottom: "1.1rem" }}>
                Conceptual multi-agent routing architecture eliminating repetitive spreadsheet audits
                and manual operational follow-ups.
              </p>
              <SmartLink to="/#scene-capabilities" className="btn btn--outline btn--sm">
                Inspect Capability Matrix &uarr;
              </SmartLink>
            </div>
          </article>

          <article className="work-editorial-piece">
            <div className="work-visual-frame">
              <span className="work-concept-tag">
                CONCEPT 03 // INFRASTRUCTURE
              </span>
              <div className="work-mini-mesh" aria-hidden="true">
                <span>POS</span>
                <span className="work-mesh-pulse">&harr; Webhook Bus &harr;</span>
                <span>Console</span>
              </div>
              <h3 className="serif-display" style={{ fontSize: "1.8rem" }}>
                Unified Telemetry Mesh
              </h3>
            </div>
            <div>
              <p className="body-copy" style={{ fontSize: "14px", marginBottom: "1.1rem" }}>
                Real-time webhook and integration layer uniting point-of-sale terminals, booking
                records and executive dashboards.
              </p>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => openWhatsApp()}
              >
                Discuss Architecture
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
