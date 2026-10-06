"use client";

import { createContext, useContext, useLayoutEffect, useState } from "react";

const ThemeContext = createContext(null);
const validTheme = (theme) => theme === "light" || theme === "dark";

function persistTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.cookie = `cyberq_theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  try { localStorage.setItem("cyberq-theme", theme); } catch {}
}

export default function ThemeProvider({ initialTheme, children }) {
  const [theme, setTheme] = useState(initialTheme || "light");
  useLayoutEffect(() => {
    let preferred = initialTheme || "light";
    if (!initialTheme) {
      try {
        const saved = localStorage.getItem("cyberq-theme");
        if (validTheme(saved)) preferred = saved;
      } catch {}
    }
    persistTheme(preferred);
    setTheme(preferred);
  }, [initialTheme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    persistTheme(next);
    setTheme(next);
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
