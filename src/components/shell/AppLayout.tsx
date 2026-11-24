import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WYNXSOL_CONFIG } from "../../config/wynxsol";
import { useMeeting } from "../../context/MeetingContext";
import { useNavigation } from "../../context/NavigationContext";
import { useWhatsApp } from "../../context/WhatsAppContext";
import { useMagnetic } from "../../hooks/useMagnetic";
import { CustomCursor } from "./CustomCursor";
import { LiquidChromeLoader } from "./LiquidChromeLoader";
import { SmartLink } from "./SmartLink";

export function AppLayout() {
  const location = useLocation();
  const { curtainState, registerHudSync, scrollToTop, stopScroll, startScroll } = useNavigation();
  const { openWhatsApp } = useWhatsApp();
  const { openMeetingModal } = useMeeting();

  const isRestaurantPage = location.pathname.startsWith("/restaurant-ai");
  const activePage = isRestaurantPage ? "restaurant-ai" : "company";

  const [showInitialLoader, setShowInitialLoader] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const params = new URLSearchParams(window.location.search);
    if (params.has("loaderT")) return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const [sceneCounter, setSceneCounter] = useState(
    activePage === "restaurant-ai" ? "CH 01 | 03" : "01 | 08"
  );
  const [activeCompanyRoute, setActiveCompanyRoute] = useState<
    "company" | "capabilities" | "process" | "contact"
  >("company");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  const progressRef = useRef<HTMLDivElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);
  const navBookRef = useMagnetic<HTMLButtonElement>(3);
  const navWaRef = useMagnetic<HTMLButtonElement>(3);

  const updateScrollHud = useCallback(() => {
    const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
    if (progressRef.current) {
      progressRef.current.style.width = `${pct.toFixed(2)}%`;
    }

    const backTopVisible = window.scrollY > 480;
    setShowBackToTop((prev) => (prev !== backTopVisible ? backTopVisible : prev));

    const scenes = document.querySelectorAll<HTMLElement>("[data-scene-index]");
    let currentIdx = activePage === "restaurant-ai" ? "CH 01 | 03" : "01 | 08";
    scenes.forEach((s) => {
      const rect = s.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.48 && s.dataset.sceneIndex) {
        currentIdx = s.dataset.sceneIndex;
      }
    });
    setSceneCounter((prev) => (prev !== currentIdx ? currentIdx : prev));

    if (activePage === "company") {
      const capEl = document.getElementById("scene-capabilities");
      const procEl = document.getElementById("scene-process");
      const contactEl = document.getElementById("contact") || document.getElementById("scene-contact");
      const threshold = window.innerHeight * 0.45;

      let nextRoute: "company" | "capabilities" | "process" | "contact" = "company";
      if (contactEl && contactEl.getBoundingClientRect().top <= threshold) {
        nextRoute = "contact";
      } else if (procEl && procEl.getBoundingClientRect().top <= threshold) {
        nextRoute = "process";
      } else if (capEl && capEl.getBoundingClientRect().top <= threshold) {
        nextRoute = "capabilities";
      }
      setActiveCompanyRoute((prev) => (prev !== nextRoute ? nextRoute : prev));
    }
  }, [activePage]);

  useEffect(() => {
    const unregister = registerHudSync(updateScrollHud);
    updateScrollHud();

    window.addEventListener("scroll", updateScrollHud, { passive: true });
    window.addEventListener("resize", updateScrollHud, { passive: true });
    return () => {
      unregister();
      window.removeEventListener("scroll", updateScrollHud);
      window.removeEventListener("resize", updateScrollHud);
    };
  }, [registerHudSync, updateScrollHud]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.hash]);

  const closeDrawer = useCallback((returnFocus = false) => {
    setDrawerOpen(false);
    if (returnFocus) {
      burgerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDrawer(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  useEffect(() => {
    if (!showInitialLoader) return;
    stopScroll();
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      startScroll();
    };
  }, [showInitialLoader, stopScroll, startScroll]);

  const handleLoaderComplete = useCallback(() => {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    startScroll();
    ScrollTrigger.refresh();
    setShowInitialLoader(false);
  }, [startScroll]);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.dataset.surfaceMode = "light";
    } else {
      delete document.documentElement.dataset.surfaceMode;
    }
  }, [isLightMode]);

  const toggleSurfaceMode = () => {
    setIsLightMode((prev) => !prev);
  };

  return (
    <>
      {showInitialLoader && <LiquidChromeLoader onComplete={handleLoaderComplete} />}

      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="arch-grid-guides" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <header className="wynx-nav" id="wynx-header">
        <div className="wynx-nav__row">
          <SmartLink to="/" className="wynx-brand" aria-label="Wynx Solutions Home">
            {WYNXSOL_CONFIG.logoAssetPath.trim() !== "" && (
              <img
                src={WYNXSOL_CONFIG.logoAssetPath}
                alt="Wynx Solutions logo"
                className="wynx-brand__img"
              />
            )}
            <span>WYNX SOLUTIONS</span>
          </SmartLink>

          <nav aria-label="Primary Navigation">
            <ul className="wynx-nav__links">
              {WYNXSOL_CONFIG.routes.map((route) => {
                const isActive =
                  activePage === "restaurant-ai"
                    ? route.id === "restaurant-ai"
                    : route.id === activeCompanyRoute;

                return (
                  <li key={route.id}>
                    <SmartLink
                      to={route.to}
                      className={`wynx-nav__link${isActive ? " is-active" : ""}`}
                      data-route-id={route.id}
                    >
                      <span className="slide-up-label">
                        <span className="slide-up-label__inner">{route.label}</span>
                        <span className="slide-up-label__clone" aria-hidden="true">
                          {route.label}
                        </span>
                      </span>
                    </SmartLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="wynx-nav__actions">
            <button
              ref={navBookRef}
              type="button"
              className="btn btn--outline btn--sm wynx-nav__cta-desktop"
              id="nav-book-meeting-btn"
              onClick={() => openMeetingModal()}
            >
              Book a Meeting
            </button>
            <button
              ref={navWaRef}
              type="button"
              className="btn btn--chrome btn--sm wynx-nav__cta-desktop"
              onClick={() => openWhatsApp()}
            >
              WhatsApp
            </button>
            <button
              ref={burgerRef}
              type="button"
              className="nav-burger"
              id="wynx-burger"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((prev) => !prev)}
            >
              Menu
            </button>
          </div>
        </div>

        <div className="wynx-nav__baseline">
          <div ref={progressRef} className="wynx-nav__progress" id="wynx-nav-progress" />
        </div>
      </header>

      <div className="wynx-hud-bottom">
        <button
          type="button"
          className="wynx-hud-pill wynx-hud-pill--btn"
          id="wynx-invert-btn"
          aria-pressed={isLightMode}
          onClick={toggleSurfaceMode}
        >
          <svg className="wynx-hud-orbit" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" />
            <circle cx="6" cy="1.8" r="1.4" fill="currentColor" />
          </svg>
          <span>{isLightMode ? "Dark Mode" : "Light Mode"}</span>
        </button>

        <div className="wynx-hud-right">
          {showBackToTop && (
            <button
              type="button"
              className="wynx-hud-pill wynx-hud-pill--btn"
              id="wynx-back-to-top"
              aria-label="Back to top"
              onClick={scrollToTop}
            >
              &uarr; Top
            </button>
          )}
          <span className="wynx-hud-pill" id="wynx-scene-counter">
            {sceneCounter}
          </span>
        </div>
      </div>

      <div
        className={`mobile-drawer${drawerOpen ? " is-open" : ""}`}
        id="wynx-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
        aria-hidden={!drawerOpen}
      >
        <div className="mobile-drawer__head">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            WYNX SOLUTIONS // NAVIGATION
          </span>
          <button
            type="button"
            className="wynx-modal__close"
            id="wynx-drawer-close"
            aria-label="Close menu"
            tabIndex={drawerOpen ? 0 : -1}
            onClick={() => closeDrawer(true)}
          >
            &times;
          </button>
        </div>

        <ul className="mobile-drawer__list">
          <li>
            <SmartLink
              to="/#company"
              className="mobile-drawer__link"
              tabIndex={drawerOpen ? 0 : -1}
              onClick={() => closeDrawer(false)}
            >
              Company
            </SmartLink>
          </li>
          <li>
            <SmartLink
              to="/#scene-capabilities"
              className="mobile-drawer__link"
              tabIndex={drawerOpen ? 0 : -1}
              onClick={() => closeDrawer(false)}
            >
              Capabilities
            </SmartLink>
          </li>
          <li>
            <SmartLink
              to="/#scene-process"
              className="mobile-drawer__link"
              tabIndex={drawerOpen ? 0 : -1}
              onClick={() => closeDrawer(false)}
            >
              Process
            </SmartLink>
          </li>
          <li>
            <SmartLink
              to="/restaurant-ai"
              className="mobile-drawer__link text-chrome"
              tabIndex={drawerOpen ? 0 : -1}
              onClick={() => closeDrawer(false)}
            >
              Restaurant Intelligence
            </SmartLink>
          </li>
          <li>
            <SmartLink
              to="/#contact"
              className="mobile-drawer__link"
              tabIndex={drawerOpen ? 0 : -1}
              onClick={() => closeDrawer(false)}
            >
              Contact
            </SmartLink>
          </li>
        </ul>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <button
            type="button"
            className="btn btn--chrome"
            id="drawer-book-meeting-btn"
            tabIndex={drawerOpen ? 0 : -1}
            onClick={() => {
              closeDrawer(false);
              openMeetingModal();
            }}
          >
            Book a Meeting
          </button>
          <button
            type="button"
            className="btn btn--outline"
            tabIndex={drawerOpen ? 0 : -1}
            onClick={() => {
              closeDrawer(false);
              openWhatsApp();
            }}
          >
            Contact Us on WhatsApp
          </button>
          <a
            href={`mailto:${WYNXSOL_CONFIG.contactEmail}`}
            tabIndex={drawerOpen ? 0 : -1}
            style={{ fontSize: "13px", color: "var(--text-primary)", textDecoration: "underline" }}
          >
            {WYNXSOL_CONFIG.contactEmail}
          </a>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {WYNXSOL_CONFIG.tagline}
          </p>
        </div>
      </div>

      <div
        className={`page-curtain${curtainState.visible ? " is-entering" : ""}`}
        aria-hidden={!curtainState.visible}
      >
        <img src={WYNXSOL_CONFIG.logoAssetPath} alt="" className="page-curtain__logo" />
        <span className="page-curtain__mark">WYNX SOLUTIONS</span>
        <span className="page-curtain__sub" id="curtain-dest">
          {curtainState.label}
        </span>
      </div>

      <CustomCursor />

      <main id="main-content">
        <Outlet />
      </main>
    </>
  );
}
