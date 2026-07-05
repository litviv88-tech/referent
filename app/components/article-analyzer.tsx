"use client";

import { useState } from "react";

type Action = "summary" | "theses" | "telegram" | "image" | "plagiarism";

type Result =
  | { type: "text"; content: string }
  | { type: "plagiarism"; percent: number }
  | { type: "image"; url: string; alt: string };

const ACTIONS: { id: Action; label: string }[] = [
  { id: "summary", label: "О чем статья" },
  { id: "theses", label: "Тезисы" },
  { id: "telegram", label: "Пост для Telegram" },
  { id: "image", label: "Изображение" },
  { id: "plagiarism", label: "Плагиат" },
];

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ArticleAnalyzer() {
  const [url, setUrl] = useState("");
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function handleAction(action: Action) {
    if (!isValidUrl(url)) {
      setError("Введите корректный URL статьи (http или https).");
      return;
    }

    setError(null);
    setActiveAction(action);
    setLoading(true);
    setResult(null);

    // Заглушка до подключения API парсинга и AI
    await new Promise((resolve) => setTimeout(resolve, 800));

    switch (action) {
      case "summary":
        setResult({
          type: "text",
          content:
            "Здесь появится краткое описание статьи после подключения AI и парсинга URL.",
        });
        break;
      case "theses":
        setResult({
          type: "text",
          content:
            "• Тезис 1\n• Тезис 2\n• Тезис 3\n\nТезисы будут сгенерированы после подключения AI.",
        });
        break;
      case "telegram":
        setResult({
          type: "text",
          content:
            "📌 Заголовок поста\n\nКраткий анонс статьи для Telegram появится здесь после подключения AI.",
        });
        break;
      case "image":
        setResult({
          type: "image",
          url: "https://placehold.co/800x450/e2e8f0/64748b?text=Referent",
          alt: "Сгенерированное изображение к статье",
        });
        break;
      case "plagiarism":
        setResult({ type: "plagiarism", percent: 0 });
        break;
    }

    setLoading(false);
  }

  const urlIsValid = url.trim().length > 0 && isValidUrl(url);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Referent
        </h1>
        <p className="text-slate-600">
          Вставьте ссылку на англоязычную или русскоязычную статью и выберите
          действие.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label htmlFor="article-url" className="mb-2 block text-sm font-medium text-slate-700">
          URL статьи
        </label>
        <input
          id="article-url"
          type="url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setError(null);
          }}
          placeholder="https://example.com/article"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => handleAction(action.id)}
              disabled={!url.trim() || loading}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>

      <section
        aria-live="polite"
        className="min-h-48 rounded-2xl border border-slate-200 bg-slate-50 p-6"
      >
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
          Результат
        </h2>

        {!activeAction && !loading && (
          <p className="text-slate-500">
            Результат появится здесь после выбора действия.
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-slate-600">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            Генерация ответа…
          </div>
        )}

        {!loading && result?.type === "text" && (
          <div className="whitespace-pre-wrap text-slate-800">{result.content}</div>
        )}

        {!loading && result?.type === "plagiarism" && (
          <div className="space-y-2">
            <p className="text-4xl font-semibold text-slate-900">{result.percent}%</p>
            <p className="text-slate-600">Оценка плагиата (данные появятся после подключения API).</p>
          </div>
        )}

        {!loading && result?.type === "image" && (
          <figure className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.url}
              alt={result.alt}
              className="max-w-full rounded-xl border border-slate-200"
            />
            <figcaption className="text-sm text-slate-500">
              Изображение к статье (заглушка до подключения генерации).
            </figcaption>
          </figure>
        )}
      </section>
    </div>
  );
}
