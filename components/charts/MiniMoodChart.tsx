"use client";
import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { JournalEntry } from "@/types/JournalEntry";
import { calculateAverageMood } from "@/lib/analytics";

// helper: group entries by date
const groupEntriesByDate = (entries: JournalEntry[]) => {
  const grouped: Record<string, JournalEntry[]> = {};
  entries.forEach((entry) => {
    if (!entry.createdAt) return;
    const dateKey = entry.createdAt.toISOString().split("T")[0];
    grouped[dateKey] = [...(grouped[dateKey] || []), entry];
  });
  return grouped;
};

export default function MiniMoodChart({ entries }: { entries: JournalEntry[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!entries.length) return;

    const grouped = groupEntriesByDate(entries);
    const dailyAverages = Object.entries(grouped)
      .map(([date, entries]) => ({
        date: new Date(date),
        day: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        avg: calculateAverageMood(entries),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: dailyAverages.map(d => d.day),
        datasets: [
          {
            label: "Mood",
            data: dailyAverages.map(d => d.avg),
            borderColor: "#6366f1", // indigo
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } },
          y: { display: false, min: 0, max: 10 },
        },
      },
    });

    return () => chart.destroy();
  }, [entries]);

  return (
    <div className="w-full h-32">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
