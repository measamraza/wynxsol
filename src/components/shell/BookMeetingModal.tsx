import { useEffect, useMemo, useState, type FormEvent } from "react";
import { WYNXSOL_CONFIG } from "../../config/wynxsol";
import { useWhatsApp } from "../../context/WhatsAppContext";
import { sendAutomaticEmail, type EmailDeliveryResult } from "../../utils/emailDelivery";
import {
  buildGoogleCalendarUrl,
  buildMeetingMailtoUrl,
  downloadMeetingIcs,
  formatDateLabel,
  formatMeetingWhatsAppText,
  generateBookingRef,
  getClientTimeZone,
  getTomorrowIsoDate,
  getUpcomingBusinessDays,
  MEETING_DURATIONS,
  MEETING_TIME_SLOTS,
  MEETING_TOPICS,
  type MeetingBooking,
} from "../../utils/meeting";

interface BookMeetingModalProps {
  open: boolean;
  sessionId: number;
  defaultTopic: string;
  onClose: () => void;
}

interface MeetingFormErrors {
  name: string;
  email: string;
  date: string;
  time: string;
}

const EMPTY_ERRORS: MeetingFormErrors = {
  name: "",
  email: "",
  date: "",
  time: "",
};

export function BookMeetingModal({
  open,
  sessionId,
  defaultTopic,
  onClose,
}: BookMeetingModalProps) {
  const { openWhatsApp } = useWhatsApp();

  const upcomingDays = useMemo(() => getUpcomingBusinessDays(8), []);
  const tomorrowIso = useMemo(() => getTomorrowIsoDate(), []);
  const timezone = useMemo(() => getClientTimeZone(), []);

  const [topic, setTopic] = useState<string>(defaultTopic || MEETING_TOPICS[0]);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [selectedDateIso, setSelectedDateIso] = useState<string>(upcomingDays[0]?.iso || tomorrowIso);
  const [selectedSlotLabel, setSelectedSlotLabel] = useState<string>(
    MEETING_TIME_SLOTS[10]?.label || "10:00 AM"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<MeetingFormErrors>(EMPTY_ERRORS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<EmailDeliveryResult | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<MeetingBooking | null>(null);

  useEffect(() => {
    setTopic(defaultTopic || MEETING_TOPICS[0]);
    setErrors(EMPTY_ERRORS);
    setIsSubmitting(false);
    setDeliveryResult(null);
    setConfirmedBooking(null);
  }, [sessionId, defaultTopic]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const slot = MEETING_TIME_SLOTS.find((s) => s.label === selectedSlotLabel);

    const nextErrors: MeetingFormErrors = {
      name: trimmedName.length >= 2 ? "" : "Please enter your full name.",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
        ? ""
        : "Please enter a valid business email.",
      date: selectedDateIso ? "" : "Please select a meeting date.",
      time: slot ? "" : "Please select a time slot.",
    };

    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.email || nextErrors.date || nextErrors.time || !slot) {
      return;
    }

    const matchedDay = upcomingDays.find((d) => d.iso === selectedDateIso);
    const booking: MeetingBooking = {
      ref: generateBookingRef(),
      topic,
      durationMinutes,
      dateIso: selectedDateIso,
      dateLabel: matchedDay ? matchedDay.fullLabel : formatDateLabel(selectedDateIso),
      timeSlot: slot,
      timezone,
      name: trimmedName,
      email: trimmedEmail,
      company: company.trim(),
      notes: notes.trim(),
      createdAtIso: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem("wynxsol_latest_booking", JSON.stringify(booking));
    } catch {
      // Ignore storage failures in restricted contexts
    }

    setIsSubmitting(true);
    const gcalUrl = buildGoogleCalendarUrl(booking, WYNXSOL_CONFIG.contactEmail);
    const result = await sendAutomaticEmail({
      subject: `[WynxSol Meeting] ${booking.topic} — ${booking.dateLabel} at ${booking.timeSlot.label} (${booking.ref})`,
      fromName: booking.name,
      replyTo: booking.email,
      fields: {
        "Booking Ref": booking.ref,
        Topic: booking.topic,
        Date: `${booking.dateLabel} (${booking.dateIso})`,
        Time: `${booking.timeSlot.label} (${booking.durationMinutes} min)`,
        Timezone: booking.timezone,
        "Client Name": booking.name,
        "Client Email": booking.email,
        Company: booking.company || "—",
        "Agenda / Notes": booking.notes || "—",
        "Add to Google Calendar (Host)": gcalUrl,
      },
    });

    setDeliveryResult(result);
    setConfirmedBooking(booking);
    setIsSubmitting(false);
  };

  const handleBookAnother = () => {
    setConfirmedBooking(null);
    setDeliveryResult(null);
    setIsSubmitting(false);
    setErrors(EMPTY_ERRORS);
  };

  return (
    <div
      id="wynx-meeting-modal"
      className={`wynx-modal${open ? " is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wynx-meeting-title"
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="wynx-modal__panel meeting-modal__panel">
        <div className="wynx-modal__head">
          <div>
            <span className="eyebrow-editorial" style={{ marginBottom: "0.35rem" }}>
              {confirmedBooking ? "Meeting Request Ready" : "Schedule Consultation"}
            </span>
            <h3 id="wynx-meeting-title" className="serif-display" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}>
              {confirmedBooking ? "Your Slot Is Reserved." : "Book a Meeting with WynxSol."}
            </h3>
          </div>
          <button
            type="button"
            className="wynx-modal__close"
            id="wynx-meeting-close"
            aria-label="Close meeting scheduler"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {!confirmedBooking ? (
          <form id="wynx-meeting-form" noValidate onSubmit={handleSubmit}>
            <div className="meeting-section">
              <span className="meeting-label">1. Meeting Topic</span>
              <div className="meeting-pill-group" role="radiogroup" aria-label="Meeting topic">
                {MEETING_TOPICS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="radio"
                    aria-checked={topic === item}
                    className={`meeting-pill${topic === item ? " is-selected" : ""}`}
                    onClick={() => setTopic(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="meeting-section">
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                <span className="meeting-label" style={{ marginBottom: 0 }}>
                  2. Duration
                </span>
                <span className="meeting-tz-note">Timezone: {timezone}</span>
              </div>
              <div className="meeting-pill-group" role="radiogroup" aria-label="Meeting duration" style={{ marginTop: "0.5rem" }}>
                {MEETING_DURATIONS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    role="radio"
                    aria-checked={durationMinutes === mins}
                    className={`meeting-pill${durationMinutes === mins ? " is-selected" : ""}`}
                    onClick={() => setDurationMinutes(mins)}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            <div className="meeting-section">
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span className="meeting-label" style={{ marginBottom: 0 }}>
                  3. Select Date
                </span>
                <label className="meeting-custom-date-wrap">
                  <span>Custom date:</span>
                  <input
                    type="date"
                    id="meeting-custom-date"
                    className="meeting-date-native"
                    min={tomorrowIso}
                    value={selectedDateIso}
                    onChange={(e) => setSelectedDateIso(e.target.value)}
                  />
                </label>
              </div>
              <div className="meeting-date-grid" role="radiogroup" aria-label="Upcoming dates">
                {upcomingDays.map((day) => (
                  <button
                    key={day.iso}
                    type="button"
                    role="radio"
                    aria-checked={selectedDateIso === day.iso}
                    className={`meeting-date-btn${selectedDateIso === day.iso ? " is-selected" : ""}`}
                    onClick={() => setSelectedDateIso(day.iso)}
                  >
                    <span className="meeting-date-btn__wk">{day.weekday}</span>
                    <strong className="meeting-date-btn__day">{day.dayNum}</strong>
                    <span className="meeting-date-btn__mo">{day.month}</span>
                  </button>
                ))}
              </div>
              {errors.date && (
                <span className="meeting-error" role="alert">
                  {errors.date}
                </span>
              )}
            </div>

            <div className="meeting-section">
              <span className="meeting-label">4. Select Time Slot</span>
              <div className="meeting-slot-grid" role="radiogroup" aria-label="Time slots">
                {MEETING_TIME_SLOTS.map((slot) => (
                  <button
                    key={slot.label}
                    type="button"
                    role="radio"
                    aria-checked={selectedSlotLabel === slot.label}
                    className={`meeting-slot-btn${selectedSlotLabel === slot.label ? " is-selected" : ""}`}
                    onClick={() => setSelectedSlotLabel(slot.label)}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
              {errors.time && (
                <span className="meeting-error" role="alert">
                  {errors.time}
                </span>
              )}
            </div>

            <div className="meeting-section">
              <span className="meeting-label">5. Your Details</span>
              <div className="meeting-form-grid">
                <div>
                  <label className="meeting-field-label" htmlFor="meeting-name">
                    Full Name *
                  </label>
                  <input
                    id="meeting-name"
                    type="text"
                    className="meeting-input"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  {errors.name && (
                    <span className="meeting-error" id="err-meeting-name" role="alert">
                      {errors.name}
                    </span>
                  )}
                </div>

                <div>
                  <label className="meeting-field-label" htmlFor="meeting-email">
                    Business Email *
                  </label>
                  <input
                    id="meeting-email"
                    type="email"
                    className="meeting-input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {errors.email && (
                    <span className="meeting-error" id="err-meeting-email" role="alert">
                      {errors.email}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: "0.75rem" }}>
                <label className="meeting-field-label" htmlFor="meeting-company">
                  Company / Restaurant (Optional)
                </label>
                <input
                  id="meeting-company"
                  type="text"
                  className="meeting-input"
                  placeholder="Organisation or venue name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div style={{ marginTop: "0.75rem" }}>
                <label className="meeting-field-label" htmlFor="meeting-notes">
                  Agenda / Project Notes (Optional)
                </label>
                <textarea
                  id="meeting-notes"
                  rows={2}
                  className="meeting-input"
                  placeholder="Share goals, current stack, or questions for the call..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="meeting-footer-actions">
              <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.64)" }}>
                Host: {WYNXSOL_CONFIG.companyName} &middot;{" "}
                <a href={`mailto:${WYNXSOL_CONFIG.contactEmail}`} style={{ color: "#FFFFFF", textDecoration: "underline" }}>
                  {WYNXSOL_CONFIG.contactEmail}
                </a>
              </span>
              <button
                type="submit"
                className="btn btn--chrome btn--sm"
                id="meeting-confirm-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending Notification..." : "Confirm Meeting Request \u2192"}
              </button>
            </div>
          </form>
        ) : (
          <div className="meeting-receipt" id="meeting-receipt">
            {deliveryResult && (
              <div
                id="meeting-delivery-status"
                role="status"
                aria-live="polite"
                className={`meeting-delivery-status meeting-delivery-status--${
                  deliveryResult.status === "activation_required"
                    ? "activation"
                    : deliveryResult.status
                }`}
              >
                {deliveryResult.message}
              </div>
            )}

            <div className="meeting-receipt__banner">
              <span className="meeting-receipt__ref">REF: {confirmedBooking.ref}</span>
              <span style={{ fontSize: "12px", color: "var(--text-white-muted)" }}>
                {deliveryResult?.status === "sent"
                  ? "Notified & ready for calendar"
                  : "Add to calendar or send copy"}
              </span>
            </div>

            <div className="meeting-receipt__grid">
              <div>
                <span className="meeting-receipt__k">Topic</span>
                <strong className="meeting-receipt__v">{confirmedBooking.topic}</strong>
              </div>
              <div>
                <span className="meeting-receipt__k">Date &amp; Time</span>
                <strong className="meeting-receipt__v">
                  {confirmedBooking.dateLabel} &middot; {confirmedBooking.timeSlot.label} (
                  {confirmedBooking.durationMinutes} min)
                </strong>
              </div>
              <div>
                <span className="meeting-receipt__k">Timezone</span>
                <span className="meeting-receipt__v">{confirmedBooking.timezone}</span>
              </div>
              <div>
                <span className="meeting-receipt__k">Client</span>
                <span className="meeting-receipt__v">
                  {confirmedBooking.name} ({confirmedBooking.email})
                  {confirmedBooking.company ? ` — ${confirmedBooking.company}` : ""}
                </span>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span className="meeting-receipt__k">Host</span>
                <span className="meeting-receipt__v">
                  {WYNXSOL_CONFIG.companyName} &middot; {WYNXSOL_CONFIG.contactEmail}
                </span>
              </div>
              {confirmedBooking.notes && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span className="meeting-receipt__k">Agenda / Notes</span>
                  <span className="meeting-receipt__v">{confirmedBooking.notes}</span>
                </div>
              )}
            </div>

            <p style={{ fontSize: "12px", color: "var(--text-white-dim)", marginTop: "1rem" }}>
              Save the event directly to your Google Calendar or calendar app, or send an additional
              email/WhatsApp copy below.
            </p>

            <div className="meeting-receipt__actions">
              <a
                href={buildGoogleCalendarUrl(confirmedBooking, WYNXSOL_CONFIG.contactEmail)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--accent btn--sm"
                id="meeting-gcal-btn"
              >
                Add to Google Calendar
              </a>
              <button
                type="button"
                className="btn btn--dark-outline btn--sm"
                id="meeting-ics-btn"
                onClick={() => downloadMeetingIcs(confirmedBooking, WYNXSOL_CONFIG.contactEmail)}
              >
                Download Calendar Invite (.ics)
              </button>
              <a
                href={buildMeetingMailtoUrl(confirmedBooking, WYNXSOL_CONFIG.contactEmail)}
                className="btn btn--dark-outline btn--sm"
                id="meeting-send-email-btn"
              >
                Open Email Copy
              </a>
              <button
                type="button"
                className="btn btn--dark-outline btn--sm"
                id="meeting-wa-btn"
                onClick={() => {
                  onClose();
                  openWhatsApp(formatMeetingWhatsAppText(confirmedBooking));
                }}
              >
                Share via WhatsApp
              </button>
              <button
                type="button"
                className="btn btn--dark-outline btn--sm"
                id="meeting-reset-btn"
                onClick={handleBookAnother}
              >
                Book Another Meeting
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
