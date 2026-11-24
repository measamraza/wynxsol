import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProblemChapter3D } from "../components/restaurant/ProblemChapter3D";
import { FloorSimulationChapter } from "../components/restaurant/FloorSimulationChapter";
import { SolutionArchitectureChapter } from "../components/restaurant/SolutionArchitectureChapter";
import { RestaurantCtaSection } from "../components/restaurant/RestaurantCtaSection";

export function RestaurantAiPage() {
  useEffect(() => {
    document.title = "Restaurant Intelligence — Problem, Simulation & 3D Architecture | WynxSol";
    document.body.dataset.page = "restaurant-ai";

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "WynxSol Restaurant Intelligence: explore dining-room operational blind spots in 3D, interact with the 7-table computer vision floor simulation, and inspect the 5-layer exploded architecture."
      );
    }

    ScrollTrigger.refresh();
  }, []);

  return (
    <>
      <ProblemChapter3D />
      <FloorSimulationChapter />
      <SolutionArchitectureChapter />
      <RestaurantCtaSection />
    </>
  );
}
