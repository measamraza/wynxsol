import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

export interface CurtainState {
  visible: boolean;
  label: string;
}

interface NavigationContextValue {
  curtainState: CurtainState;
  navigateWithCurtain: (to: string, customLabel?: string) => void;
  scrollToHash: (rawHash: string) => void;
  scrollToTop: () => void;
  stopScroll: () => void;
  startScroll: () => void;
  registerHudSync: (fn: () => void) => () => void;
  triggerHudSync: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

function normalizeRoutePath(path: string): string {
  if (!path || path === "/index.html") return "/";
  if (path === "/restaurant-ai.html") return "/restaurant-ai";
  return path;
}

function getCurtainLabel(to: string, customLabel?: string): string {
  if (customLabel) return customLabel;
  if (to.includes("restaurant-ai")) return "ENTERING RESTAURANT INTELLIGENCE";
  if (to.includes("#contact")) return "NAVIGATING TO CONTACT";
  if (to.includes("#scene-capabilities")) return "NAVIGATING TO CAPABILITIES";
  if (to.includes("#scene-process")) return "NAVIGATING TO PROCESS";
  return "RETURNING TO WYNX SOLUTIONS";
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useReducedMotion();

  const lenisRef = useRef<Lenis | null>(null);
  const hudSyncFnsRef = useRef<Set<() => void>>(new Set());
  const curtainTimerRef = useRef<number | null>(null);
  const hideCurtainTimerRef = useRef<number | null>(null);
  const prevPathnameRef = useRef<string>(normalizeRoutePath(location.pathname));

  const [curtainState, setCurtainState] = useState<CurtainState>({
    visible: false,
    label: "ENTERING ENVIRONMENT",
  });

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  const triggerHudSync = useCallback(() => {
    hudSyncFnsRef.current.forEach((fn) => fn());
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    const onLenisScroll = () => {
      ScrollTrigger.update();
      triggerHudSync();
    };
    lenis.on("scroll", onLenisScroll);

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.off("scroll", onLenisScroll);
      lenis.destroy();
      if (lenisRef.current === lenis) {
        lenisRef.current = null;
      }
    };
  }, [reducedMotion, triggerHudSync]);

  const stopScroll = useCallback(() => {
    lenisRef.current?.stop();
  }, []);

  const startScroll = useCallback(() => {
    lenisRef.current?.start();
  }, []);

  const registerHudSync = useCallback((fn: () => void) => {
    hudSyncFnsRef.current.add(fn);
    return () => {
      hudSyncFnsRef.current.delete(fn);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { duration: 1.0, force: true });
    } else {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }, [reducedMotion]);

  const scrollToHash = useCallback(
    (rawHash: string) => {
      const cleanId = rawHash ? rawHash.replace(/^#/, "") : "";

      // Always land at exact y=0 opening hero when targeting Company or empty hash
      if (!cleanId || cleanId === "company" || cleanId === "scene-opening") {
        scrollToTop();
        return;
      }

      const performScroll = () => {
        ScrollTrigger.refresh(true);
        const targetEl = document.getElementById(cleanId);
        if (!targetEl) return;

        const targetY = Math.max(0, Math.round(targetEl.getBoundingClientRect().top + window.scrollY));
        if (lenisRef.current) {
          lenisRef.current.scrollTo(targetY, { duration: 1.05, force: true });
        } else {
          window.scrollTo({ top: targetY, behavior: reducedMotion ? "auto" : "smooth" });
        }
      };

      window.requestAnimationFrame(() => {
        performScroll();
        // Re-verify once sticky/WebGL heights settle after cross-page mount
        window.setTimeout(performScroll, 220);
      });
    },
    [reducedMotion, scrollToTop]
  );

  // Sync scroll position on route or hash changes
  useEffect(() => {
    const currentPath = normalizeRoutePath(location.pathname);
    const pathChanged = prevPathnameRef.current !== currentPath;
    prevPathnameRef.current = currentPath;

    if (pathChanged) {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true, force: true });
      }
      window.scrollTo(0, 0);
    }

    const scrollTimer = window.setTimeout(() => {
      ScrollTrigger.refresh(true);
      if (location.hash) {
        scrollToHash(location.hash);
      }
      triggerHudSync();
    }, pathChanged ? 160 : 80);

    return () => {
      window.clearTimeout(scrollTimer);
    };
  }, [location.pathname, location.hash, scrollToHash, triggerHudSync]);

  const navigateWithCurtain = useCallback(
    (to: string, customLabel?: string) => {
      const currentPath = normalizeRoutePath(location.pathname);

      let targetPath = currentPath;
      let targetHash = "";

      if (to.startsWith("#")) {
        targetHash = to;
      } else {
        const [rawPath, rawHash] = to.split("#");
        targetPath = normalizeRoutePath(rawPath.startsWith("/") ? rawPath : `/${rawPath}`);
        targetHash = rawHash ? `#${rawHash}` : "";
      }

      // Same-page navigation or hash scroll
      if (targetPath === currentPath) {
        const nextUrl = `${targetPath}${targetHash}`;
        if (`${currentPath}${location.hash}` !== nextUrl) {
          navigate(nextUrl);
        }
        window.requestAnimationFrame(() => {
          scrollToHash(targetHash);
        });
        return;
      }

      const nextDestination = `${targetPath}${targetHash}`;
      if (reducedMotion) {
        navigate(nextDestination);
        return;
      }

      if (curtainTimerRef.current !== null) {
        window.clearTimeout(curtainTimerRef.current);
      }
      if (hideCurtainTimerRef.current !== null) {
        window.clearTimeout(hideCurtainTimerRef.current);
      }

      const label = getCurtainLabel(to, customLabel);
      setCurtainState({ visible: true, label });

      curtainTimerRef.current = window.setTimeout(() => {
        navigate(nextDestination);
        hideCurtainTimerRef.current = window.setTimeout(() => {
          setCurtainState((prev) => ({ ...prev, visible: false }));
        }, 160);
      }, 340);
    },
    [location.pathname, location.hash, navigate, reducedMotion, scrollToHash]
  );

  useEffect(() => {
    return () => {
      if (curtainTimerRef.current !== null) window.clearTimeout(curtainTimerRef.current);
      if (hideCurtainTimerRef.current !== null) window.clearTimeout(hideCurtainTimerRef.current);
    };
  }, []);

  const value = useMemo<NavigationContextValue>(
    () => ({
      curtainState,
      navigateWithCurtain,
      scrollToHash,
      scrollToTop,
      stopScroll,
      startScroll,
      registerHudSync,
      triggerHudSync,
    }),
    [
      curtainState,
      navigateWithCurtain,
      scrollToHash,
      scrollToTop,
      stopScroll,
      startScroll,
      registerHudSync,
      triggerHudSync,
    ]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return ctx;
}
