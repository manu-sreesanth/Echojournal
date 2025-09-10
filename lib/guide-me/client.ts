import { GuideSession } from "./types";
import jsPDF from "jspdf";

export async function startGuideSession(uid: string, preMood?: string): Promise<GuideSession> {
  const res = await fetch("/api/guide-me/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, preMood }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// JSON export (optional: keep for debugging / raw data export)
export function downloadJSONSession(session: GuideSession) {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `guide-session-${session.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// NEW: PDF export
export function downloadPDFSession(session: GuideSession) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Guide Me Session", 14, 20);

  // Session metadata
  doc.setFontSize(10);
  doc.text(`Session ID: ${session.id}`, 14, 28);
  if ((session as any).createdAt) {
    doc.text(`Date: ${new Date((session as any).createdAt).toLocaleString()}`, 14, 34);
  }

  let y = 44;

  if (session.output) {
    // Key Insights
    doc.setFontSize(14);
    doc.text("Key Insights:", 14, y);
    y += 6;

    doc.setFontSize(11);
    session.output.insights.forEach((i) => {
      doc.text(`• ${i}`, 18, y);
      y += 6;
    });

    y += 4;

    // Next Steps
    doc.setFontSize(14);
    doc.text("Next Steps:", 14, y);
    y += 6;

    doc.setFontSize(11);
    session.output.nextSteps.forEach((n) => {
      doc.text(`• ${n}`, 18, y);
      y += 6;
    });

    y += 4;

    // Action Items
    doc.setFontSize(14);
    doc.text("Action Items:", 14, y);
    y += 6;

    doc.setFontSize(11);
    session.output.actionItems.forEach((ai) => {
      doc.text(`☑ ${ai.text}`, 18, y);
      y += 6;
    });
  }

  // Save as PDF
  doc.save(`guide-session-${session.id}.pdf`);
}

// ICS calendar export (unchanged)
export function downloadICSFollowUp(title: string, description: string, startISO: string, durationMins = 15) {
  // Ultra-simple ICS
  const dt = (iso: string) => iso.replace(/[-:]/g, "").split(".")[0] + "Z";
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMins * 60000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GuideMe//Kai//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@guideme`,
    `DTSTAMP:${dt(new Date().toISOString())}`,
    `DTSTART:${dt(start.toISOString())}`,
    `DTEND:${dt(end.toISOString())}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `guide-followup-${start.toISOString().slice(0, 10)}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
