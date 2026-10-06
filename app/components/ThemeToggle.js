"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "@phosphor-icons/react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label="Dark theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      onClick={toggleTheme}
    >
      <Sun size={15} aria-hidden="true" />
      <span className="theme-toggle-track" aria-hidden="true"><span /></span>
      <Moon size={15} aria-hidden="true" />
    </button>
  );
}
