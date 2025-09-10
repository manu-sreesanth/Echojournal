// components/ReflectionPrompt.tsx
"use client";
import { useState,} from "react";

type Props = {
  type: "weekly" | "monthly";
  onAccept: () => void;
  onDismiss: () => void;
};

export default function ReflectionPrompt({ type, onAccept, onDismiss }: Props) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const label = type === "weekly" ? "last week" : "last month";

  return (
    <div style={{
      position: "fixed",
      bottom: 30,
      right: 30,
      padding: "1rem",
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      zIndex: 1000,
    }}>
      <p>✨ Want to see how your {label} went?</p>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <button onClick={() => { onAccept(); setVisible(false); }}>Yes</button>
        <button onClick={() => { onDismiss(); setVisible(false); }}>Not now</button>
      </div>
    </div>
  );
}
