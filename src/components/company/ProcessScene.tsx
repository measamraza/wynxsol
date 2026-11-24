import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROCESS_STAGES } from "../../data/company";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { ProcessMechanismCanvas } from "./ProcessMechanismCanvas";

export function ProcessScene() {
  const reducedMotion = useReducedMotion();
  const [activeStage, setActiveStage] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top 60%",
      end: "bottom 40%",
      onUpdate: (self) => {
        const target = Math.min(
          PROCESS_STAGES.length - 1,
          Math.floor(self.progress * PROCESS_STAGES.length)
        );
        setActiveStage((prev) => (prev !== target ? target : prev));
      },
    });

    return () => {
      st.kill();
    };
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="process-scene"
      id="scene-process"
      data-scene-index="06 | 08"
      aria-labelledby="process-heading"
    >
      <div className="container">
        <span className="eyebrow-editorial">06 // Our Process</span>
        <h2
          className="serif-display"
          id="process-heading"
          style={{ fontSize: "var(--text-3xl)", maxWidth: "16ch" }}
        >
          PRECISION FROM DISCOVERY TO <span className="text-chrome">DEPLOYMENT.</span>
        </h2>

        <div className="process-layout">
          <ProcessMechanismCanvas activeStage={activeStage} />

          <div className="process-rows" id="process-rows">
            {PROCESS_STAGES.map((stage, idx) => {
              const active = idx === activeStage;
              return (
                <button
                  key={stage.num}
                  type="button"
                  className={`process-row${active ? " is-active" : ""}`}
                  aria-expanded={active}
                  onClick={() => setActiveStage(idx)}
                >
                  <span className="process-row__num">{stage.num}</span>
                  <div>
                    <div className="process-row__title">{stage.title}</div>
                    <div className="process-row__body">
                      <p className="process-row__desc">{stage.description}</p>
                    </div>
                  </div>
                  <span className="process-row__toggle">{active ? "\u2212" : "+"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
