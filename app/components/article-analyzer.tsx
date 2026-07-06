"use client";

import { useState } from "react";
import { fetchJson } from "@/lib/fetch-json";

type Action =
  | "summary"
  | "theses"
  | "telegram"
  | "translate"
  | "image"
  | "plagiarism";

type ParsedArticle = {
  date: string | null;
  title: string;
  content: string;
};

type Result =
  | { type: "text"; text: string }
  | { type: "theses"; items: string[] }
  | { type: "telegram"; text: string }
  | { type: "article"; data: ParsedArticle }
  | { type: "plagiarism"; percent: number; method: string; details: string }
  | { type: "image"; url: string; alt: string };

const ACTIONS: { id: Action; label: string }[] = [
  { id: "summary", label: "О чем статья" },
  { id: "theses", label: "Тезисы" },
  { id: "telegram", label: "Пост для Telegram" },
  { id: "translate", label: "Перевод" },
  { id: "image", label: "Изображение" },
  { id: "plagiarism", label: "Плагиат" },
];

const LOADING_LABELS: Record<Action, string> = {
  summary: "Генерация описания…",
  theses: "Формирование тезисов…",
  telegram: "Создание поста…",
  translate: "Перевод статьи…",
  image: "Генерация изображения…",
  plagiarism: "Проверка на плагиат…",
};

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function parseArticle(url: string): Promise<ParsedArticle> {
  return fetchJson<ParsedArticle>("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export default function ArticleAnalyzer() {
  const [url, setUrl] = useState("");
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleAction(action: Action) {
    if (!isValidUrl(url)) {
      setError("Введите корректный URL статьи (http или https).");
      return;
    }

    setError(null);
    setCopied(false);
    setActiveAction(action);
    setLoading(true);
    setResult(null);

    try {
      if (action === "summary") {
        const data = await fetchJson<{ text: string }>("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        setResult({ type: "text", text: data.text });
        return;
      }

      if (action === "theses") {
        const data = await fetchJson<{ items: string[] }>("/api/theses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        setResult({ type: "theses", items: data.items });
        return;
      }

      if (action === "telegram") {
        const data = await fetchJson<{ text: string }>("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        setResult({ type: "telegram", text: data.text });
        return;
      }

      if (action === "translate") {
        const data = await fetchJson<ParsedArticle>("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        setResult({ type: "article", data });
        return;
      }

      const article = await parseArticle(url);

      if (action === "plagiarism") {
        const data = await fetchJson<{
          percent: number;
          method: string;
          details: string;
        }>("/api/plagiarism", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: article.content }),
        });

        setResult({
          type: "plagiarism",
          percent: data.percent,
          method: data.method,
          details: data.details,
        });
        return;
      }

      if (action === "image") {
        const data = await fetchJson<{ url: string; alt: string }>(
          "/api/image",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: article.title,
              content: article.content,
            }),
          },
        );

        setResult({
          type: "image",
          url: data.url,
          alt: data.alt,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const loadingLabel = activeAction ? LOADING_LABELS[activeAction] : "";

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
        <label
          htmlFor="article-url"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
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
            {loadingLabel}
          </div>
        )}

        {!loading && result?.type === "text" && (
          <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">
            {result.text}
          </p>
        )}

        {!loading && result?.type === "theses" && (
          <ol className="list-decimal space-y-2 pl-5 text-slate-800">
            {result.items.map((item, index) => (
              <li key={index} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ol>
        )}

        {!loading && result?.type === "telegram" && (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">
              {result.text}
            </p>
            <button
              type="button"
              onClick={() => handleCopy(result.text)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
        )}

        {!loading && result?.type === "article" && (
          <article className="space-y-4">
            {result.data.date && (
              <time className="text-sm text-slate-500">{result.data.date}</time>
            )}
            <h3 className="text-xl font-semibold text-slate-900">
              {result.data.title}
            </h3>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">
              {result.data.content}
            </p>
          </article>
        )}

        {!loading && result?.type === "plagiarism" && (
          <div className="space-y-2">
            <p className="text-4xl font-semibold text-slate-900">
              {result.percent}%
            </p>
            <p className="text-sm text-slate-500">
              Метод:{" "}
              {result.method === "openrouter-rerank"
                ? "OpenRouter Rerank"
                : "локальный"}
            </p>
            <p className="text-slate-600">{result.details}</p>
          </div>
        )}

        {!loading && result?.type === "image" && (
          <figure className="space-y-3">
            <img
              src={result.url}
              alt={result.alt}
              className="max-w-full rounded-xl border border-slate-200"
            />
            <figcaption className="text-sm text-slate-500">
              {result.alt}
            </figcaption>
          </figure>
        )}
      </section>
    </div>
  );
}
