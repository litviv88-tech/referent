"use client";

import { useState } from "react";

type ActionType = "summary" | "theses" | "telegram" | "translate";

type ResultData = {
  date?: string;
  title?: string;
  titleRu?: string;
  content?: string;
  translation?: string;
  text?: string;
  error?: string;
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

const LOADING_TEXT: Record<ActionType, string> = {
  summary: "Парсим статью и готовим краткое описание…",
  theses: "Парсим статью и составляем тезисы…",
  telegram: "Парсим статью и пишем пост для Telegram…",
  translate: "Парсим статью и переводим на русский…",
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);

  async function handleAction(action: ActionType) {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    setActiveAction(action);
    try {
      const res = await fetch(API_ROUTES[action], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(`Ошибка: ${data.error ?? res.statusText}`);
      } else {
        setResult(data as ResultData);
      }
    } catch (e: unknown) {
      setError(`Ошибка: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  const title = result?.titleRu || result?.title;
  const body =
    result?.text || result?.translation || result?.content || "";

  return (
    <main className="min-h-screen flex flex-col items-stretch p-4 py-8">
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-center">Referent</h1>
        <p className="text-center text-gray-500">
          Вставьте ссылку на англоязычную статью и выберите действие
        </p>

        <input
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          {(Object.keys(ACTION_LABELS) as ActionType[]).map((key) => (
            <button
              key={key}
              onClick={() => handleAction(key)}
              disabled={loading || !url.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {ACTION_LABELS[key]}
            </button>
          ))}
        </div>

        {(loading || error || result) && (
          <div className="rounded-lg border border-gray-200 bg-white p-5 min-h-[120px] flex flex-col gap-4 overflow-x-hidden">
            {loading ? (
              <p className="text-gray-400 animate-pulse">
                {activeAction ? LOADING_TEXT[activeAction] : "Загрузка…"}
              </p>
            ) : error ? (
              <p className="text-red-600 break-words">{error}</p>
            ) : (
              <>
                {activeAction === "translate" && title && (
                  <h2 className="text-xl font-semibold leading-snug break-words">
                    {title}
                  </h2>
                )}
                {activeAction === "translate" && result?.date && (
                  <p className="text-sm text-gray-500 break-words">
                    {result.date}
                  </p>
                )}
                {activeAction && activeAction !== "translate" && (
                  <p className="text-sm font-medium text-gray-500">
                    {ACTION_LABELS[activeAction]}
                  </p>
                )}
                {body && (
                  <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {body}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
