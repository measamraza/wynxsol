import { useCallback, useEffect, useRef, useState } from "react";
import {
  createInitialTables,
  STAGE_META,
  STAGE_TO_TELEMETRY_MAX,
  TELEMETRY_12_STEPS,
  type RestaurantTable,
} from "../../data/restaurant";
import { useMeeting } from "../../context/MeetingContext";
import { useWhatsApp } from "../../context/WhatsAppContext";
import { SmartLink } from "../shell/SmartLink";

function createStageOneTables(): RestaurantTable[] {
  return createInitialTables().map((t) =>
    t.id === "04" ? { ...t, status: "occupied", hasGuests: true, minutes: 1 } : t
  );
}

function getStatusLabel(t: RestaurantTable): string {
  switch (t.status) {
    case "occupied":
      return `Occupied \u2022 ${String(t.minutes).padStart(2, "0")}:00`;
    case "awaiting_waiter":
      return "Awaiting Waiter \u2022 15:00";
    case "attended":
      return "Attended";
    case "awaiting_cleaning":
      return "Awaiting Cleaning";
    case "ready":
      return "Ready";
    default:
      return "Available";
  }
}

export function FloorSimulationChapter() {
  const { openWhatsApp } = useWhatsApp();
  const { openMeetingModal } = useMeeting();

  const [tables, setTables] = useState<RestaurantTable[]>(createStageOneTables);
  const [stage, setStage] = useState<number>(1);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [waiterPos, setWaiterPos] = useState({ x: 16, y: 14 });
  const [cleanerPos, setCleanerPos] = useState({ x: 44, y: 14 });
  const [toast, setToast] = useState({ visible: false, title: "", subtitle: "" });
  const [statusBanner, setStatusBanner] = useState(
    "Guests arrive at Table 04. Computer vision detects occupancy & starts simulated timer."
  );
  const [turnoverCount, setTurnoverCount] = useState(0);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const accelTimerRef = useRef<number | null>(null);
  const autoPlayTimerRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const tablesRef = useRef(tables);
  tablesRef.current = tables;

  const clearTimers = useCallback(() => {
    if (accelTimerRef.current !== null) {
      window.clearInterval(accelTimerRef.current);
      accelTimerRef.current = null;
    }
    if (autoPlayTimerRef.current !== null) {
      window.clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const startStage = useCallback(
    (targetStage: number, keepPlaying = false) => {
      clearTimers();
      isPlayingRef.current = keepPlaying;
      setIsPlaying(keepPlaying);
      setStage(targetStage);

      const scheduleNext = (delayMs: number, nextStage: number) => {
        if (!isPlayingRef.current) return;
        if (autoPlayTimerRef.current !== null) {
          window.clearTimeout(autoPlayTimerRef.current);
        }
        autoPlayTimerRef.current = window.setTimeout(() => {
          if (!isPlayingRef.current) return;
          if (nextStage <= 6) {
            startStage(nextStage, true);
          } else {
            isPlayingRef.current = false;
            setIsPlaying(false);
          }
        }, delayMs);
      };

      const t4Snapshot = tablesRef.current.find((t) => t.id === "04") || { x: 49, y: 58 };

      if (targetStage === 1) {
        setTables(createStageOneTables());
        setWaiterPos({ x: 16, y: 14 });
        setCleanerPos({ x: 44, y: 14 });
        setToast({ visible: false, title: "", subtitle: "" });
        setStatusBanner(
          "Guests arrive at Table 04. Computer vision detects occupancy & starts simulated timer."
        );
        scheduleNext(2400, 2);
      } else if (targetStage === 2) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === "04" ? { ...t, status: "occupied", hasGuests: true, minutes: 2 } : t
          )
        );
        setToast({ visible: false, title: "", subtitle: "" });
        setStatusBanner("Accelerated simulated 15-minute clock tracking Table 04 wait time...");

        let simulatedMinutes = 2;
        accelTimerRef.current = window.setInterval(() => {
          simulatedMinutes += 3;
          if (simulatedMinutes >= 15) {
            if (accelTimerRef.current !== null) {
              window.clearInterval(accelTimerRef.current);
              accelTimerRef.current = null;
            }
            setTables((prev) =>
              prev.map((t) =>
                t.id === "04"
                  ? { ...t, status: "awaiting_waiter", hasGuests: true, minutes: 15 }
                  : t
              )
            );
            setTotalAlerts((c) => c + 1);
            setToast({
              visible: true,
              title: "Service alert: Table 04",
              subtitle: "15-minute threshold reached without waiter attendance.",
            });
            setStatusBanner(
              "15-minute wait reached. Status: Awaiting waiter. Notification triggered."
            );
            scheduleNext(2600, 3);
          } else {
            const mins = simulatedMinutes;
            setTables((prev) =>
              prev.map((t) => (t.id === "04" ? { ...t, minutes: mins } : t))
            );
          }
        }, 300);
      } else if (targetStage === 3) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === "04" ? { ...t, status: "attended", hasGuests: true } : t
          )
        );
        setWaiterPos({ x: t4Snapshot.x - 6, y: t4Snapshot.y - 6 });
        setToast({ visible: false, title: "", subtitle: "" });
        setStatusBanner("Waiter assigned & responds. Table 04 status: Attended.");
        scheduleNext(2300, 4);
      } else if (targetStage === 4) {
        setWaiterPos({ x: 16, y: 14 });
        setTables((prev) =>
          prev.map((t) =>
            t.id === "04"
              ? { ...t, hasGuests: false, status: "awaiting_cleaning", minutes: 0 }
              : t
          )
        );
        setToast({
          visible: true,
          title: "Table 04 requires cleaning.",
          subtitle: "Guests left. Cleaning notification dispatched.",
        });
        setStatusBanner("Guests leave Table 04. Status: Awaiting cleaning.");
        scheduleNext(2400, 5);
      } else if (targetStage === 5) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === "04" ? { ...t, hasGuests: false, status: "ready" } : t
          )
        );
        setCleanerPos({ x: t4Snapshot.x + 6, y: t4Snapshot.y - 6 });
        setToast({ visible: false, title: "", subtitle: "" });
        setTurnoverCount((c) => Math.max(1, c + 1));
        setStatusBanner("Cleaning completed. Table 04 status: Ready for new seating.");
        scheduleNext(2400, 6);
      } else if (targetStage === 6) {
        setCleanerPos({ x: 44, y: 14 });
        setTables((prev) =>
          prev.map((t) =>
            t.id === "04" ? { ...t, status: "available", hasGuests: false, minutes: 0 } : t
          )
        );
        setTotalAlerts((c) => Math.max(1, c));
        setTurnoverCount((c) => Math.max(1, c));
        setToast({ visible: false, title: "", subtitle: "" });
        setStatusBanner("Full lifecycle complete. Table 04 is Available again.");
        isPlayingRef.current = false;
        setIsPlaying(false);
      }
    },
    [clearTimers]
  );

  const handlePlayPause = () => {
    if (isPlaying) {
      clearTimers();
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      startStage(stage === 6 ? 1 : stage, true);
    }
  };

  const handleSkip = () => {
    const next = stage < 6 ? stage + 1 : 1;
    startStage(next, false);
  };

  const handleReset = () => {
    setTotalAlerts(0);
    setTurnoverCount(0);
    setSelectedTableId(null);
    startStage(1, false);
  };

  const handleSelectTable = (tableId: string) => {
    clearTimers();
    isPlayingRef.current = false;
    setIsPlaying(false);
    setSelectedTableId(tableId);
  };

  const handleTableAction = (action: "arrive" | "delay" | "attend" | "leave" | "clean" | "close") => {
    clearTimers();
    isPlayingRef.current = false;
    setIsPlaying(false);

    if (action === "close" || !selectedTableId) {
      setSelectedTableId(null);
      return;
    }

    const target = tables.find((t) => t.id === selectedTableId);
    if (!target) {
      setSelectedTableId(null);
      return;
    }

    if (action === "arrive") {
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTableId ? { ...t, status: "occupied", hasGuests: true, minutes: 1 } : t
        )
      );
      setStatusBanner(`Guests arrived at ${target.label}. Status: Occupied.`);
    } else if (action === "delay") {
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTableId
            ? { ...t, status: "awaiting_waiter", hasGuests: true, minutes: 15 }
            : t
        )
      );
      setTotalAlerts((c) => c + 1);
      setToast({
        visible: true,
        title: `Service alert: ${target.label}`,
        subtitle: "15m wait threshold reached.",
      });
      setStatusBanner(`${target.label} waiting for waiter.`);
    } else if (action === "attend") {
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTableId ? { ...t, status: "attended", hasGuests: true } : t
        )
      );
      setWaiterPos({ x: target.x - 5, y: target.y - 5 });
      setToast({ visible: false, title: "", subtitle: "" });
      setStatusBanner(`${target.label} attended by waiter.`);
    } else if (action === "leave") {
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTableId
            ? { ...t, status: "awaiting_cleaning", hasGuests: false, minutes: 0 }
            : t
        )
      );
      setToast({
        visible: true,
        title: `${target.label} requires cleaning.`,
        subtitle: "Cleaning team notified.",
      });
      setStatusBanner(`${target.label} marked Awaiting cleaning.`);
    } else if (action === "clean") {
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTableId ? { ...t, status: "available", hasGuests: false } : t
        )
      );
      setCleanerPos({ x: target.x + 5, y: target.y - 5 });
      setTurnoverCount((c) => c + 1);
      setToast({ visible: false, title: "", subtitle: "" });
      setStatusBanner(`${target.label} cleaned and Available.`);
    }
  };

  const occupiedCount = tables.filter((t) =>
    ["occupied", "awaiting_waiter", "attended"].includes(t.status)
  ).length;
  const availableCount = tables.filter((t) => ["available", "ready"].includes(t.status)).length;
  const waitingCount = tables.filter((t) => t.status === "awaiting_waiter").length;
  const cleaningCount = tables.filter((t) => t.status === "awaiting_cleaning").length;

  const activeTelemetryMax = STAGE_TO_TELEMETRY_MAX[stage] || 4;
  const stageMeta = STAGE_META[stage] || STAGE_META[1];

  return (
    <>
      <section
        className="sim-chapter-header"
        id="chapter-simulation"
        data-scene-index="CH 02 | 03"
        aria-labelledby="sim-heading"
      >
        <div className="container">
          <div className="concept-pill">Conceptual Demonstration // Simulated Environment Only</div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "1.5rem",
            }}
          >
            <div>
              <span className="eyebrow-editorial">
                Chapter 02 // Interactive Floor Simulation
              </span>
              <h2
                className="serif-display"
                id="sim-heading"
                style={{ fontSize: "clamp(2.2rem, 5vw, 4.6rem)", textTransform: "uppercase" }}
              >
                TOP-DOWN FLOOR INTELLIGENCE.
              </h2>
              <p className="lead-copy" style={{ marginTop: "0.75rem" }}>
                Not connected to live CCTV cameras or deployed in a restaurant. Zero facial
                recognition or customer identity tracking.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <SmartLink to="#chapter-solution" className="btn btn--outline btn--sm">
                Chapter 03: Architecture &darr;
              </SmartLink>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                id="sim-book-meeting-btn"
                onClick={() => openMeetingModal("Restaurant Intelligence Demo")}
              >
                Book a Meeting
              </button>
              <button
                type="button"
                className="btn btn--chrome btn--sm"
                onClick={() =>
                  openWhatsApp("Hi Wynx Solutions, I'd like to discuss the Restaurant Intelligence solution.")
                }
              >
                Discuss This Solution
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        className="sim-section"
        id="restaurant-walkthrough"
        data-scene-index="CH 02 | 03"
        aria-label="Interactive Restaurant Operations Simulation"
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div
              className="sim-stage-pills"
              id="sim-stage-pills"
              style={{ marginBottom: 0 }}
              role="tablist"
              aria-label="Simulation steps"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="tab"
                  aria-selected={stage === n}
                  className={`sim-stage-pill ${
                    stage === n ? "is-active" : n < stage ? "is-done" : ""
                  }`}
                  onClick={() => startStage(n, false)}
                >
                  {STAGE_META[n].pill}
                </button>
              ))}
            </div>

            <div className="sim-transport">
              <button
                type="button"
                className="btn btn--chrome btn--sm"
                id="sim-play-pause-btn"
                aria-pressed={isPlaying}
                onClick={handlePlayPause}
              >
                {isPlaying ? "\u23F8 Pause" : "\u25B6 Start"}
              </button>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                id="sim-skip-btn"
                onClick={handleSkip}
              >
                &#9197; Skip
              </button>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                id="sim-restart-btn"
                onClick={handleReset}
              >
                &#8634; Reset
              </button>
            </div>
          </div>

          <div className="sim-arena">
            <div className="sim-hud-bar">
              <div>
                <strong style={{ display: "block", fontSize: "15px" }} id="sim-hud-title">
                  {stageMeta.title}
                </strong>
                <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.72)" }} id="sim-hud-status">
                  {statusBanner}
                </span>
              </div>
              <button
                type="button"
                className="btn btn--chrome btn--sm"
                id="sim-primary-action"
                onClick={handleSkip}
              >
                {stageMeta.cta}
              </button>
            </div>

            <div
              className="sim-telemetry-trail"
              id="sim-telemetry-trail"
              aria-label="12-step simulated computer vision event sequence"
            >
              {TELEMETRY_12_STEPS.map((lbl, idx) => (
                <span
                  key={lbl}
                  className={`sim-telemetry-chip${idx < activeTelemetryMax ? " is-active" : ""}`}
                >
                  {lbl}
                </span>
              ))}
            </div>

            <div className="sim-insights-strip" aria-label="Simulated operational metrics">
              <div className="sim-insight-cell">
                <div className="sim-insight-cell__label">Occupied Tables</div>
                <div className="sim-insight-cell__val" id="dash-occupied">
                  {occupiedCount} / {tables.length}
                </div>
              </div>
              <div className="sim-insight-cell">
                <div className="sim-insight-cell__label">Available Tables</div>
                <div className="sim-insight-cell__val" id="dash-available">
                  {availableCount}
                </div>
              </div>
              <div className="sim-insight-cell">
                <div className="sim-insight-cell__label">Waiting Tables</div>
                <div className="sim-insight-cell__val" id="dash-waiting">
                  {waitingCount} ({totalAlerts} total)
                </div>
              </div>
              <div className="sim-insight-cell">
                <div className="sim-insight-cell__label">Cleaning Required</div>
                <div className="sim-insight-cell__val" id="dash-cleaning">
                  {cleaningCount}
                </div>
              </div>
              <div className="sim-insight-cell">
                <div className="sim-insight-cell__label">Response Times</div>
                <div className="sim-insight-cell__val" id="dash-response">
                  1m 42s (sim)
                </div>
              </div>
              <div className="sim-insight-cell">
                <div className="sim-insight-cell__label">Table Turnover</div>
                <div className="sim-insight-cell__val" id="dash-turnover">
                  {turnoverCount} turned
                </div>
              </div>
            </div>

            <div
              className="sim-table-dock"
              id="sim-table-dock"
              hidden={!selectedTableId}
              role="region"
              aria-label="Selected table manual controls"
            >
              {selectedTableId && (
                <>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#FFFFFF" }}>
                    Manual Table Control &mdash; Table {selectedTableId}
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => handleTableAction("arrive")}
                    >
                      Guests Arrive
                    </button>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => handleTableAction("delay")}
                    >
                      15m Wait Alert
                    </button>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => handleTableAction("attend")}
                    >
                      Assign Waiter
                    </button>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => handleTableAction("leave")}
                    >
                      Guests Leave
                    </button>
                    <button
                      type="button"
                      className="btn btn--chrome btn--sm"
                      onClick={() => handleTableAction("clean")}
                    >
                      Mark Clean
                    </button>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      aria-label="Close manual table control"
                      onClick={() => handleTableAction("close")}
                    >
                      &times;
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="sim-floor-wrap" id="sim-floor-wrap">
              <div className="sim-zone-marker sim-zone-marker--station">
                Waiter &amp; Cleaning Station
              </div>
              <div className="sim-zone-marker sim-zone-marker--kitchen">Kitchen Pass</div>
              <div className="sim-zone-marker sim-zone-marker--entrance">Dining Entrance</div>

              {tables.map((t) => {
                const statusLabel = getStatusLabel(t);
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`sim-table-island${selectedTableId === t.id ? " is-selected" : ""}`}
                    style={{ left: `${t.x}%`, top: `${t.y}%` }}
                    data-sim-table={t.id}
                    data-status={t.status}
                    data-has-guests={String(t.hasGuests)}
                    aria-label={`${t.label}: ${statusLabel}`}
                    onClick={() => handleSelectTable(t.id)}
                  >
                    <span className="sim-chair sim-chair--top" aria-hidden="true" />
                    <span className="sim-chair sim-chair--bottom" aria-hidden="true" />
                    <span className="sim-chair sim-chair--left" aria-hidden="true" />
                    <span className="sim-chair sim-chair--right" aria-hidden="true" />
                    <span className="sim-guest sim-guest--1" aria-hidden="true" />
                    <span className="sim-guest sim-guest--2" aria-hidden="true" />

                    <div className="sim-table-surface">
                      <strong style={{ fontSize: "12px" }}>T-{t.id}</strong>
                      {(t.status === "occupied" || t.status === "awaiting_waiter") && (
                        <span style={{ fontSize: "10px", color: "#FFFFFF", fontWeight: 600 }}>
                          {String(t.minutes).padStart(2, "0")}:00
                        </span>
                      )}
                    </div>
                    <span className="sim-table-badge">{statusLabel}</span>
                  </button>
                );
              })}

              <div
                className="sim-staff-avatar sim-staff-avatar--waiter"
                style={{ left: `${waiterPos.x}%`, top: `${waiterPos.y}%` }}
              >
                <span>WAITER</span>
              </div>

              <div
                className="sim-staff-avatar sim-staff-avatar--cleaner"
                style={{ left: `${cleanerPos.x}%`, top: `${cleanerPos.y}%` }}
              >
                <span>CLEANING</span>
              </div>

              <div
                className={`sim-manager-toast${toast.visible ? " is-visible" : ""}`}
                role="status"
                aria-live="polite"
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Simulated Notification
                </div>
                <strong style={{ display: "block", fontSize: "13px", marginTop: "3px" }}>
                  {toast.title}
                </strong>
                <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.72)" }}>
                  {toast.subtitle}
                </span>
              </div>
            </div>

            <div className="sim-state-legend" aria-label="All six simulated table states">
              <span className="sim-legend-item">
                <i data-state="available" /> Available
              </span>
              <span className="sim-legend-item">
                <i data-state="occupied" /> Occupied
              </span>
              <span className="sim-legend-item">
                <i data-state="awaiting_waiter" /> Awaiting Waiter
              </span>
              <span className="sim-legend-item">
                <i data-state="attended" /> Attended
              </span>
              <span className="sim-legend-item">
                <i data-state="awaiting_cleaning" /> Awaiting Cleaning
              </span>
              <span className="sim-legend-item">
                <i data-state="ready" /> Ready
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "1rem",
              marginTop: "1.5rem",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            <span>
              Simulated demonstration only — accelerated simulated clock for concept walkthrough.
              Zero facial recognition or identity tracking.
            </span>
            <span>Click any table (T-01 to T-07) to trigger manual events directly.</span>
          </div>
        </div>
      </section>
    </>
  );
}
