export interface PhilosophyPillar {
  id: string;
  word: string;
  accent?: boolean;
  tabLabel: string;
  description: string;
}

export interface CapabilityItem {
  id: string;
  index: string;
  title: string;
  links: string[];
  summary: string;
  demoAction: string;
  demoBefore: string;
  demoAfter: string;
  whatsappText: string;
}

export interface ProcessStage {
  num: string;
  title: string;
  description: string;
  hudLabel: string;
}

export const PHILOSOPHY_PILLARS: PhilosophyPillar[] = [
  {
    id: "intent",
    word: "INTENT.",
    tabLabel: "01 | 03 Intent",
    description:
      "Every system begins with an operational truth—eliminating friction rather than adding interface layers.",
  },
  {
    id: "intelligence",
    word: "INTELLIGENCE.",
    accent: true,
    tabLabel: "02 | 03 Intelligence",
    description:
      "Artificial intelligence, computer vision and autonomous logic engineered as dependable infrastructure.",
  },
  {
    id: "execution",
    word: "EXECUTION.",
    tabLabel: "03 | 03 Execution",
    description:
      "Uncompromising software architecture built to operate quietly at scale for Pakistani and global teams.",
  },
];

export const CAPABILITIES: CapabilityItem[] = [
  {
    id: "ai-systems",
    index: "01",
    title: "AI Systems",
    links: ["intelligent-automation", "computer-vision", "agentic-workflows"],
    summary:
      "Custom AI models, assistants and decision intelligence engineered directly into your operational environment.",
    demoAction: "Simulate AI Decision Query",
    demoBefore: "Unstructured customer & operational requests queuing manually",
    demoAfter: "Domain AI classifies intent, extracts context & routes action in < 1s",
    whatsappText: "Hi WynxSol, I'd like to discuss Custom AI Systems.",
  },
  {
    id: "intelligent-automation",
    index: "02",
    title: "Intelligent Automation",
    links: ["ai-systems", "agentic-workflows", "system-integrations"],
    summary:
      "Self-sustaining pipelines that replace repetitive human handoffs, spreadsheets and delayed status updates.",
    demoAction: "Run Pipeline Trigger",
    demoBefore: "Manual copy-paste exports across shift reports",
    demoAfter: "Event trigger validates rules, updates databases & dispatches alerts automatically",
    whatsappText: "Hi WynxSol, I'd like to discuss Intelligent Automation workflows.",
  },
  {
    id: "custom-software",
    index: "03",
    title: "Custom Software",
    links: ["system-integrations", "ai-systems", "computer-vision"],
    summary:
      "Durable SaaS platforms, operator consoles and enterprise web applications designed for speed and clarity.",
    demoAction: "Inspect Platform Stack",
    demoBefore: "Rigid generic templates slowing down internal teams",
    demoAfter: "Purpose-built software console unified with live telemetry & role access",
    whatsappText: "Hi WynxSol, I'd like to build Custom Software or a SaaS platform.",
  },
  {
    id: "computer-vision",
    index: "04",
    title: "Computer Vision",
    links: ["ai-systems", "agentic-workflows", "custom-software"],
    summary:
      "Privacy-conscious visual analysis of authorised camera feeds to monitor table states and floor operations.",
    demoAction: "Scan Floor Camera Zone",
    demoBefore: "Unseen 15-minute table delays & uncoordinated cleaning",
    demoAfter: "Zone occupancy & cleaning states streamed continuously (zero facial tracking)",
    whatsappText: "Hi WynxSol, I'd like to discuss Computer Vision engineering.",
  },
  {
    id: "agentic-workflows",
    index: "05",
    title: "Agentic Workflows",
    links: ["ai-systems", "intelligent-automation", "system-integrations"],
    summary:
      "Autonomous AI agents capable of planning multi-step actions, invoking APIs and verifying operational completion.",
    demoAction: "Dispatch Autonomous Cycle",
    demoBefore: "Static rules breaking on edge-case exceptions",
    demoAfter: "Agent decomposes exception, calls tools & logs human-verified resolution",
    whatsappText: "Hi WynxSol, I'd like to discuss Agentic Workflows.",
  },
  {
    id: "system-integrations",
    index: "06",
    title: "System Integrations",
    links: ["custom-software", "intelligent-automation", "agentic-workflows"],
    summary:
      "Resilient APIs and data pipelines connecting POS systems, CRMs, ERPs and WhatsApp notifications seamlessly.",
    demoAction: "Synchronize API Bus",
    demoBefore: "Disconnected POS, booking logs and reporting tools",
    demoAfter: "Bi-directional webhooks keep every platform synchronized in real time",
    whatsappText: "Hi WynxSol, I need System Integrations & API engineering.",
  },
];

export const PROCESS_STAGES: ProcessStage[] = [
  {
    num: "01",
    title: "DISCOVER",
    description: "Understand the business, problem and opportunity.",
    hudLabel: "STAGE 01 // DISCOVER",
  },
  {
    num: "02",
    title: "DESIGN",
    description: "Define the system, architecture and experience.",
    hudLabel: "STAGE 02 // DESIGN",
  },
  {
    num: "03",
    title: "ENGINEER",
    description: "Build the software, intelligence and integrations.",
    hudLabel: "STAGE 03 // ENGINEER",
  },
  {
    num: "04",
    title: "REFINE",
    description: "Test, optimize and improve the solution.",
    hudLabel: "STAGE 04 // REFINE",
  },
  {
    num: "05",
    title: "DEPLOY",
    description: "Prepare the system for real-world use.",
    hudLabel: "STAGE 05 // DEPLOY",
  },
];
