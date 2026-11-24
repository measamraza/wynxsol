import { WYNXSOL_CONFIG } from "../config/wynxsol";

export type EmailDeliveryStatus = "sent" | "activation_required" | "error";

export interface EmailDeliveryResult {
  status: EmailDeliveryStatus;
  provider: "formsubmit" | "web3forms";
  message: string;
}

export interface SendAutomaticEmailOptions {
  subject: string;
  fromName: string;
  replyTo: string;
  fields: Record<string, string>;
}

export async function sendAutomaticEmail(
  options: SendAutomaticEmailOptions
): Promise<EmailDeliveryResult> {
  const contactEmail = WYNXSOL_CONFIG.contactEmail.trim();
  const web3formsKey = WYNXSOL_CONFIG.web3formsAccessKey.trim();
  const provider: "formsubmit" | "web3forms" = web3formsKey ? "web3forms" : "formsubmit";

  if (!contactEmail && !web3formsKey) {
    return {
      status: "error",
      provider,
      message: "No destination email configured. Please use the manual buttons below.",
    };
  }

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 12_000);

  try {
    const endpoint = web3formsKey
      ? "https://api.web3forms.com/submit"
      : `https://formsubmit.co/ajax/${contactEmail}`;

    const payload = web3formsKey
      ? {
          access_key: web3formsKey,
          subject: options.subject,
          from_name: options.fromName,
          replyto: options.replyTo,
          botcheck: "",
          ...options.fields,
        }
      : {
          name: options.fromName,
          email: options.replyTo,
          _replyto: options.replyTo,
          _subject: options.subject,
          _template: "table",
          _captcha: "false",
          _honey: "",
          ...options.fields,
        };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as
      | { success?: boolean | string; message?: string }
      | null;

    if (response.ok && (data?.success === true || data?.success === "true")) {
      return {
        status: "sent",
        provider,
        message: `Notification sent automatically to ${contactEmail}.`,
      };
    }

    if (typeof data?.message === "string" && /activat/i.test(data.message)) {
      return {
        status: "activation_required",
        provider,
        message: `One-time FormSubmit activation email sent to ${contactEmail}. Open that inbox (and check Spam) and click the activation link once — every booking and inquiry after that will deliver automatically.`,
      };
    }

    return {
      status: "error",
      provider,
      message:
        (typeof data?.message === "string" && data.message) ||
        "Automatic email delivery did not complete. Use Open Email Copy, Google Calendar, or WhatsApp below.",
    };
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "AbortError";
    return {
      status: "error",
      provider,
      message: isTimeout
        ? "Email notification request timed out. Use Open Email Copy, Google Calendar, or WhatsApp below."
        : "Could not reach the automatic email service right now. Use Open Email Copy, Google Calendar, or WhatsApp below.",
    };
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}
