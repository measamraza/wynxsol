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
import { createPortal } from "react-dom";
import { BookMeetingModal } from "../components/shell/BookMeetingModal";
import { MEETING_TOPICS } from "../utils/meeting";
import { useNavigation } from "./NavigationContext";

interface MeetingContextValue {
  openMeetingModal: (defaultTopic?: string) => void;
  closeMeetingModal: () => void;
}

const MeetingContext = createContext<MeetingContextValue | null>(null);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const { stopScroll, startScroll } = useNavigation();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [defaultTopic, setDefaultTopic] = useState<string>(MEETING_TOPICS[0]);
  const [sessionId, setSessionId] = useState(0);
  const closeTimerRef = useRef<number | null>(null);

  const openMeetingModal = useCallback(
    (topic?: string) => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setDefaultTopic(topic || MEETING_TOPICS[0]);
      setSessionId((n) => n + 1);
      setMounted(true);
      stopScroll();
      window.requestAnimationFrame(() => {
        setOpen(true);
      });
    },
    [stopScroll]
  );

  const closeMeetingModal = useCallback(() => {
    setOpen(false);
    startScroll();
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setMounted(false);
    }, 320);
  }, [startScroll]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMeetingModal();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeMeetingModal]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      startScroll();
    };
  }, [startScroll]);

  const value = useMemo<MeetingContextValue>(
    () => ({
      openMeetingModal,
      closeMeetingModal,
    }),
    [openMeetingModal, closeMeetingModal]
  );

  return (
    <MeetingContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <BookMeetingModal
            open={open}
            sessionId={sessionId}
            defaultTopic={defaultTopic}
            onClose={closeMeetingModal}
          />,
          document.body
        )}
    </MeetingContext.Provider>
  );
}

export function useMeeting(): MeetingContextValue {
  const ctx = useContext(MeetingContext);
  if (!ctx) {
    throw new Error("useMeeting must be used within a MeetingProvider");
  }
  return ctx;
}
