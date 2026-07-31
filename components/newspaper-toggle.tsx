"use client";

import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";

function applyClippings(on: boolean) {
  document.documentElement.classList.toggle("clippings-on", on);
}

export default function NewspaperToggle() {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("referent-clippings") === "1";
    setOn(saved);
    applyClippings(saved);
    setReady(true);
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    applyClippings(next);
    window.localStorage.setItem("referent-clippings", next ? "1" : "0");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={
        on
          ? "Выключить фон с газетными вырезками"
          : "Включить фон с газетными вырезками"
      }
      aria-pressed={on}
      aria-label="Газетные вырезки"
      className={`fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition ${
        on
          ? "border-[var(--btn)] bg-[var(--btn)] text-[var(--btn-fg)]"
          : "border-[var(--border)] bg-[var(--btn-secondary-bg)] text-[var(--fg)] hover:bg-[var(--btn-secondary-hover)]"
      }`}
    >
      <Newspaper className="size-4" aria-hidden />
      <span>{ready && on ? "Вырезки вкл." : "Газетные вырезки"}</span>
    </button>
  );
}
