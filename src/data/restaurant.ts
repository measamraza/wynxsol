export type TableStatus =
  | "available"
  | "occupied"
  | "awaiting_waiter"
  | "attended"
  | "awaiting_cleaning"
  | "ready";

export interface RestaurantTable {
  id: string;
  label: string;
  x: number;
  y: number;
  status: TableStatus;
  hasGuests: boolean;
  minutes: number;
}

export interface ProblemBeat {
  pillLabel: string;
  tag: string;
  cam: string;
  title: string;
  desc: string;
}

export interface SimulationStageMeta {
  pill: string;
  title: string;
  cta: string;
}

export interface SolutionLayer {
  num: string;
  hudLabel: string;
  title: string;
  description: string;
}

export function createInitialTables(): RestaurantTable[] {
  return [
    { id: "01", label: "Table 01", x: 20, y: 36, status: "attended", hasGuests: true, minutes: 8 },
    { id: "02", label: "Table 02", x: 49, y: 27, status: "available", hasGuests: false, minutes: 0 },
    { id: "03", label: "Table 03", x: 78, y: 28, status: "ready", hasGuests: false, minutes: 0 },
    { id: "04", label: "Table 04", x: 49, y: 58, status: "available", hasGuests: false, minutes: 0 },
    { id: "05", label: "Table 05", x: 20, y: 74, status: "occupied", hasGuests: true, minutes: 5 },
    { id: "06", label: "Table 06", x: 78, y: 78, status: "available", hasGuests: false, minutes: 0 },
    { id: "07", label: "Table 07", x: 78, y: 53, status: "ready", hasGuests: false, minutes: 0 },
  ];
}

export const PROBLEM_BEATS: ProblemBeat[] = [
  {
    pillLabel: "01 Waiting",
    tag: "ISSUE 01 // GUESTS WAITING",
    cam: "CAMERA: DINING FLOOR",
    title: "Guests wait longer than noticed during peak service",
    desc: "Seated guests at Table 04 begin waiting without immediate staff visibility.",
  },
  {
    pillLabel: "02 Unattended",
    tag: "ISSUE 02 // UNATTENDED OCCUPIED TABLES",
    cam: "CAMERA: TABLE ORBIT",
    title: "Occupied tables go unattended past key minutes",
    desc: "Without time-based floor tracking, busy shifts allow 15-minute delays to go unseen.",
  },
  {
    pillLabel: "03 Uncleaned",
    tag: "ISSUE 03 // TABLES LEFT UNCLEANED",
    cam: "CAMERA: BUSSING ZONE",
    title: "Departed tables remain uncleaned while guests wait",
    desc: "Unmonitored departures leave tables unbussed and unavailable for incoming parties.",
  },
  {
    pillLabel: "04 Blind Spots",
    tag: "ISSUE 04 // MANAGER BLIND SPOTS",
    cam: "CAMERA: WIDE FLOOR",
    title: "Staff miss floor events & managers lack live overview",
    desc: "Fragmented floor communication hides which tables need service or clearing right now.",
  },
  {
    pillLabel: "05 Top-Down",
    tag: "PERSPECTIVE SHIFT // FLOOR INTELLIGENCE",
    cam: "CAMERA: TOP-DOWN PLAN (90°)",
    title: "From dining-room blind spots to real-time top-down clarity",
    desc: "The camera rises overhead, revealing the live interactive floor simulation below.",
  },
];

export const TELEMETRY_12_STEPS: string[] = [
  "01 Guests Arrive",
  "02 Table Occupied",
  "03 CV Detects Zone",
  "04 Timer Starts",
  "05 Wait Tracked",
  "06 15m Threshold Alert",
  "07 Waiter Assigned",
  "08 Table Attended",
  "09 Guests Leave",
  "10 Cleaning Alert",
  "11 Mark Cleaned",
  "12 Table Ready",
];

export const STAGE_TO_TELEMETRY_MAX: Record<number, number> = {
  1: 4,
  2: 6,
  3: 8,
  4: 10,
  5: 11,
  6: 12,
};

export const STAGE_META: Record<number, SimulationStageMeta> = {
  1: {
    pill: "1. Guests Arrive",
    title: "01 — Guests arrive & occupy Table 04",
    cta: "Start Accelerated 15m Timer →",
  },
  2: {
    pill: "2. 15m Alert",
    title: "02 — Simulated 15-minute threshold alert",
    cta: "Assign Waiter (Mark Attended) →",
  },
  3: {
    pill: "3. Attended",
    title: "03 — Waiter responds & Table 04 becomes Attended",
    cta: "Simulate Guests Leaving →",
  },
  4: {
    pill: "4. Awaiting Cleaning",
    title: "04 — Guests leave & cleaning alert triggered",
    cta: "Mark Table Clean →",
  },
  5: {
    pill: "5. Ready & Available",
    title: "05 — Cleaning completed & Table 04 Ready",
    cta: "Complete Lifecycle Cycle →",
  },
  6: {
    pill: "6. Summary",
    title: "06 — Simulated Operational Turnover Complete",
    cta: "Restart Simulation ↺",
  },
};

export const SOLUTION_LAYERS: SolutionLayer[] = [
  {
    num: "01",
    hudLabel: "LAYER 01 // CAMERA FEEDS",
    title: "Restaurant Camera Feeds",
    description:
      "Monitors overhead dining zones using authorised restaurant video streams—focused purely on table occupancy geometry with zero facial recognition.",
  },
  {
    num: "02",
    hudLabel: "LAYER 02 // COMPUTER VISION",
    title: "Computer Vision Processing",
    description:
      "Transforms raw spatial table regions into structured arrival, attendance, departure and clearing signals in real time.",
  },
  {
    num: "03",
    hudLabel: "LAYER 03 // EVENT DETECTION",
    title: "Table Occupancy & Event Detection",
    description:
      "Tracks live seating states and starts per-table waiting timers continuously from guest arrival to staff contact.",
  },
  {
    num: "04",
    hudLabel: "LAYER 04 // NOTIFICATION BUS",
    title: "Intelligent Notification System",
    description:
      "Dispatches waiter response alerts when the configured 15-minute threshold passes and triggers cleaning workflows the moment guests depart.",
  },
  {
    num: "05",
    hudLabel: "LAYER 05 // OPERATIONAL DASHBOARD",
    title: "Operational Dashboard",
    description:
      "Gives hospitality managers a clear single-screen picture of occupied tables, response cadence, cleaning queue and floor turnover.",
  },
];
