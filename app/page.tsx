"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Copy, Eraser } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ThemeToggle from "@/components/theme-toggle";
import type { AppErrorCode } from "@/lib/errors";
import { friendlyMessage } from "@/lib/errors";

type ActionType = "summary" | "theses" | "telegram" | "translate";

type ResultData = {
  date?: string;
  title?: string;
  titleRu?: string;
  content?: string;
  translation?: string;
  text?: string;
  error?: string;
  code?: AppErrorCode;
};

const ACTION_LABELS: Record<ActionType, string> = {
  summary: "О чём статья?",
  theses: "Тезисы",
  telegram: "Пост для Telegram",
  translate: "Перевод",
};

const API_ROUTES: Record<ActionType, string> = {
  summary: "/api/summary",
  theses: "/api/theses",
  telegram: "/api/telegram",
  translate: "/api/translate",
};

const ACTION_TITLES: Record<ActionType, string> = {
  summary: "Кратко описать, о чём статья (2–4 предложения)",
  theses: "Выделить 5–10 ключевых тезисов статьи",
  telegram: "Сгенерировать короткий пост для Telegram со ссылкой на источник",
  translate: "Перевести заголовок и текст статьи на русский язык",
};

const LOADING_TEXT: Record<ActionType, string> = {
  summary: "Парсим статью и готовим краткое описание…",
  theses: "Парсим статью и составляем тезисы…",
  telegram: "Парсим статью и пишем пост для Telegram…",
  translate: "Парсим статью и переводим на русский…",
};

type ProcessState = "idle" | "loading" | "done" | "error";

function getProcessMessage(
  state: ProcessState,
  action: ActionType | null
): string {
  if (state === "idle" || !action) {
    return "Ожидание: вставьте URL и выберите действие";
  }
  if (state === "loading") {
    return LOADING_TEXT[action];
  }
  if (state === "error") {
    return `Ошибка при выполнении: ${ACTION_LABELS[action]}`;
  }
  return `Готово: ${ACTION_LABELS[action]}`;
}

function mapClientError(error: unknown): string {
  if (!(error instanceof Error)) {
    return friendlyMessage("UNKNOWN");
  }
  const msg = error.message.toLowerCase();
  if (msg.includes("failed to fetch") || msg.includes("network")) {
    return "Нет связи с сервером. Проверьте интернет и попробуйте снова.";
  }
  return friendlyMessage("UNKNOWN");
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  async function handleAction(action: ActionType) {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    setCopied(false);
    setActiveAction(action);
    try {
      const res = await fetch(API_ROUTES[action], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), action }),
      });

      let data: ResultData = {};
      try {
        data = await res.json();
      } catch {
        setError(friendlyMessage("UNKNOWN"));
        return;
      }

      if (!res.ok) {
        setError(
          data.error ||
            (data.code
              ? friendlyMessage(data.code)
              : friendlyMessage("UNKNOWN"))
        );
        return;
      }

      setResult(data);
    } catch (e: unknown) {
      setError(mapClientError(e));
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setUrl("");
    setResult(null);
    setError("");
    setLoading(false);
    setActiveAction(null);
    setCopied(false);
  }

  async function handleCopy() {
    const textToCopy = [activeAction === "translate" ? title : null, body]
      .filter(Boolean)
      .join("\n\n");

    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Не удалось скопировать текст. Попробуйте выделить вручную.");
    }
  }

  const title = result?.titleRu || result?.title;
  const body = result?.text || result?.translation || result?.content || "";

  const processState: ProcessState = loading
    ? "loading"
    : error
      ? "error"
      : result
        ? "done"
        : "idle";

  const processMessage = getProcessMessage(processState, activeAction);
  const showResult = Boolean((error || result) && !loading);

  useEffect(() => {
    if (!showResult || !resultRef.current) return;
    resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showResult, result, error]);

  const processStyle =
    processState === "loading"
      ? {
          borderColor: "var(--process-loading-border)",
          background: "var(--process-loading-bg)",
          color: "var(--process-loading-fg)",
        }
      : processState === "error"
        ? {
            borderColor: "var(--process-error-border)",
            background: "var(--process-error-bg)",
            color: "var(--process-error-fg)",
          }
        : processState === "done"
          ? {
              borderColor: "var(--process-done-border)",
              background: "var(--process-done-bg)",
              color: "var(--process-done-fg)",
            }
          : {
              borderColor: "var(--process-idle-border)",
              background: "var(--process-idle-bg)",
              color: "var(--process-idle-fg)",
            };

  return (
    <main className="min-h-screen flex flex-col items-stretch px-4 py-6 sm:px-6 sm:py-8 md:py-10">
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-5 sm:gap-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <header className="space-y-2 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold break-words text-[var(--fg)]">
            Referent
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)] break-words px-1">
            Вставьте ссылку на англоязычную статью и выберите действие
          </p>
        </header>

        <input
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading && url.trim()) {
              handleAction("summary");
            }
          }}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--fg)] px-4 py-3 text-base sm:text-lg outline-none transition focus:ring-2 focus:ring-[var(--btn)]/30"
        />

        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:justify-center">
          {(Object.keys(ACTION_LABELS) as ActionType[]).map((key) => (
            <button
              key={key}
              type="button"
              title={ACTION_TITLES[key]}
              onClick={() => handleAction(key)}
              disabled={loading || !url.trim()}
              className="w-full md:w-auto rounded-lg bg-[var(--btn)] px-5 py-2.5 text-[var(--btn-fg)] font-medium hover:bg-[var(--btn-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {ACTION_LABELS[key]}
            </button>
          ))}
          <button
            type="button"
            title="Сбросить URL, результат, ошибки и состояние"
            onClick={handleClear}
            disabled={loading}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--btn-secondary-bg)] px-5 py-2.5 text-[var(--fg)] font-medium hover:bg-[var(--btn-secondary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Eraser className="size-4" aria-hidden />
            Очистить
          </button>
        </div>

        <div
          className={`rounded-lg border px-4 py-3 text-sm break-words ${
            processState === "loading" ? "animate-pulse" : ""
          }`}
          style={processStyle}
          aria-live="polite"
        >
          <p className="font-medium">Текущий процесс</p>
          <p className="mt-1">{processMessage}</p>
        </div>

        {showResult && (
          <div ref={resultRef} className="scroll-mt-4 flex flex-col gap-3">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>
                  <p className="break-words">{error}</p>
                </AlertDescription>
              </Alert>
            ) : (
              <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5 min-h-[120px] flex flex-col gap-4 overflow-x-hidden">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Результат
                  </h2>
                  <button
                    type="button"
                    title="Скопировать результат в буфер обмена"
                    onClick={handleCopy}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--fg)] hover:bg-[var(--btn-secondary-hover)] transition"
                  >
                    {copied ? (
                      <Check className="size-4 text-green-600" aria-hidden />
                    ) : (
                      <Copy className="size-4" aria-hidden />
                    )}
                    {copied ? "Скопировано" : "Копировать"}
                  </button>
                </div>

                {activeAction === "translate" && title && (
                  <h3 className="text-lg sm:text-xl font-semibold leading-snug break-words text-[var(--fg)]">
                    {title}
                  </h3>
                )}
                {activeAction === "translate" && result?.date && (
                  <p className="text-sm text-[var(--muted)] break-words">
                    {result.date}
                  </p>
                )}
                {activeAction && activeAction !== "translate" && (
                  <p className="text-sm font-medium text-[var(--muted)] break-words">
                    {ACTION_LABELS[activeAction]}
                  </p>
                )}
                {body && (
                  <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--fg)]">
                    {body}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
