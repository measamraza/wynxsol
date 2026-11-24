import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { WYNXSOL_CONFIG } from "../config/wynxsol";

interface WhatsAppContextValue {
  buildWhatsAppUrl: (customText?: string) => string | null;
  openWhatsApp: (customText?: string) => void;
}

const WhatsAppContext = createContext<WhatsAppContextValue | null>(null);

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const buildWhatsAppUrl = useCallback((customText?: string): string | null => {
    const rawNum = (WYNXSOL_CONFIG.whatsappNumber || "").replace(/[^0-9]/g, "");
    const message = customText || WYNXSOL_CONFIG.whatsappDefaultMessage;
    if (!rawNum) return null;
    return `https://wa.me/${rawNum}?text=${encodeURIComponent(message)}`;
  }, []);

  const openWhatsApp = useCallback(
    (customText?: string) => {
      const message = customText || WYNXSOL_CONFIG.whatsappDefaultMessage;
      const url = buildWhatsAppUrl(message);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    },
    [buildWhatsAppUrl]
  );

  const value = useMemo<WhatsAppContextValue>(
    () => ({
      buildWhatsAppUrl,
      openWhatsApp,
    }),
    [buildWhatsAppUrl, openWhatsApp]
  );

  return <WhatsAppContext.Provider value={value}>{children}</WhatsAppContext.Provider>;
}

export function useWhatsApp(): WhatsAppContextValue {
  const ctx = useContext(WhatsAppContext);
  if (!ctx) {
    throw new Error("useWhatsApp must be used within a WhatsAppProvider");
  }
  return ctx;
}
