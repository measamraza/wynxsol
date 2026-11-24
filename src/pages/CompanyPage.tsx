import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { OpeningScene } from "../components/company/OpeningScene";
import { PerceptionCorridorScene } from "../components/company/PerceptionCorridorScene";
import { PhilosophyScene } from "../components/company/PhilosophyScene";
import { CapabilitiesScene } from "../components/company/CapabilitiesScene";
import { WorkScene } from "../components/company/WorkScene";
import { ProcessScene } from "../components/company/ProcessScene";
import { FoundersScene } from "../components/company/FoundersScene";
import { ContactScene } from "../components/company/ContactScene";

export function CompanyPage() {
  useEffect(() => {
    document.title = "WynxSol — Intelligence, Engineered";
    document.body.dataset.page = "company";

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "WynxSol engineers custom AI systems, intelligent automation, computer vision and software infrastructure to move businesses forward."
      );
    }

    ScrollTrigger.refresh();
  }, []);

  return (
    <>
      <OpeningScene />
      <PerceptionCorridorScene />
      <PhilosophyScene />
      <CapabilitiesScene />
      <WorkScene />
      <ProcessScene />
      <FoundersScene />
      <ContactScene />
    </>
  );
}
