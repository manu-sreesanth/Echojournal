"use client";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: "8px 12px",
        borderRadius: "6px",
        marginBottom: "16px",
        background: theme === "dark" ? "#444" : "#ddd",
        color: theme === "dark" ? "#fff" : "#000",
        border: "none",
        cursor: "pointer",
      }}
    >
      {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}