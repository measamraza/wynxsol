export const MEETING_TOPICS = [
  "Discovery & AI Strategy",
  "Restaurant Intelligence Demo",
  "Custom Software & Automation",
  "Technical Architecture Review",
] as const;

export type MeetingTopic = (typeof MEETING_TOPICS)[number];

export const MEETING_DURATIONS = [15, 30, 45] as const;

export interface MeetingTimeSlot {
  label: string;
  hours: number;
  minutes: number;
}

export const MEETING_TIME_SLOTS: MeetingTimeSlot[] = Array.from({ length: 24 }, (_, hours) => {
  const period = hours < 12 ? "AM" : "PM";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return {
    label: `${String(h12).padStart(2, "0")}:00 ${period}`,
    hours,
    minutes: 0,
  };
});

export interface UpcomingDayOption {
  iso: string;
  weekday: string;
  dayNum: string;
  month: string;
  fullLabel: string;
}

export interface MeetingBooking {
  ref: string;
  topic: string;
  durationMinutes: number;
  dateIso: string;
  dateLabel: string;
  timeSlot: MeetingTimeSlot;
  timezone: string;
  name: string;
  email: string;
  company: string;
  notes: string;
  createdAtIso: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function formatDateLabel(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return iso;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getTomorrowIsoDate(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return toLocalIsoDate(d);
}

export function getUpcomingBusinessDays(count = 8): UpcomingDayOption[] {
  const days: UpcomingDayOption[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  while (days.length < count) {
    // Include Mon–Sat, skip Sunday
    if (cursor.getDay() !== 0) {
      const iso = toLocalIsoDate(cursor);
      days.push({
        iso,
        weekday: cursor.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: pad2(cursor.getDate()),
        month: cursor.toLocaleDateString("en-US", { month: "short" }),
        fullLabel: cursor.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function getClientTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function generateBookingRef(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `WX-${year}-${suffix}`;
}

function toUtcCompact(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function computeUtcRange(
  dateIso: string,
  slot: MeetingTimeSlot,
  durationMinutes: number
): { startUtc: string; endUtc: string } {
  const [y, m, d] = dateIso.split("-").map(Number);
  const start = new Date(y, (m || 1) - 1, d || 1, slot.hours, slot.minutes, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return {
    startUtc: toUtcCompact(start),
    endUtc: toUtcCompact(end),
  };
}

function buildBookingDetailsText(booking: MeetingBooking): string {
  const lines = [
    `Booking Ref: ${booking.ref}`,
    `Topic: ${booking.topic}`,
    `Date: ${booking.dateLabel} (${booking.dateIso})`,
    `Time: ${booking.timeSlot.label} (${booking.durationMinutes} min)`,
    `Timezone: ${booking.timezone}`,
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    booking.company ? `Company: ${booking.company}` : null,
    booking.notes ? `Agenda / Notes: ${booking.notes}` : null,
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
}

export function buildMeetingMailtoUrl(booking: MeetingBooking, contactEmail: string): string {
  const subject = `[WynxSol Meeting Request] ${booking.topic} — ${booking.dateLabel} at ${booking.timeSlot.label} (${booking.ref})`;
  const body = `Hi WynxSol Team,\n\nI would like to confirm the following consultation meeting:\n\n${buildBookingDetailsText(
    booking
  )}\n\nLooking forward to speaking with you.`;
  return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    body
  )}`;
}

export function buildGoogleCalendarUrl(booking: MeetingBooking, contactEmail: string): string {
  const { startUtc, endUtc } = computeUtcRange(
    booking.dateIso,
    booking.timeSlot,
    booking.durationMinutes
  );
  const text = `WynxSol — ${booking.topic}`;
  const details = buildBookingDetailsText(booking);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text,
    dates: `${startUtc}/${endUtc}`,
    details,
    add: contactEmail,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function downloadMeetingIcs(booking: MeetingBooking, contactEmail: string): void {
  const { startUtc, endUtc } = computeUtcRange(
    booking.dateIso,
    booking.timeSlot,
    booking.durationMinutes
  );
  const stamp = toUtcCompact(new Date());
  const summary = escapeIcsText(`WynxSol — ${booking.topic}`);
  const description = escapeIcsText(buildBookingDetailsText(booking));

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WynxSol//Meeting Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${booking.ref}@wynxsol`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `ORGANIZER;CN=WynxSol:mailto:${contactEmail}`,
    `ATTENDEE;CN=${escapeIcsText(booking.name)}:mailto:${booking.email}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `wynxsol-meeting-${booking.ref.toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatMeetingWhatsAppText(booking: MeetingBooking): string {
  return `Hi WynxSol, I've requested a meeting:\n${buildBookingDetailsText(booking)}`;
}
