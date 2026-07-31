"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("referent-theme");
    const next: Theme = saved === "dark" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    setReady(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem("referent-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={
        theme === "light"
          ? "Включить тёмную тему"
          : "Включить светлую тему"
      }
      aria-label={
        theme === "light"
          ? "Включить тёмную тему"
          : "Включить светлую тему"
      }
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--btn-secondary-bg)] px-3 py-2 text-sm font-medium text-[var(--fg)] hover:bg-[var(--btn-secondary-hover)] transition"
    >
      {ready && theme === "dark" ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
      <span className="hidden sm:inline">
        {theme === "dark" ? "Светлая" : "Тёмная"}
      </span>
    </button>
  );
}
