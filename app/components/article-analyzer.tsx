"use client";

import { useState } from "react";
import { ErrorAlert } from "@/components/error-alert";
import { fetchJson } from "@/lib/fetch-json";
import {
  API_ERROR_CODES,
  ClientApiError,
  type ApiErrorCode,
} from "@/lib/errors";

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

const ACTIONS: { id: Action; label: string; title: string }[] = [
  {
    id: "summary",
    label: "О чем статья",
    title: "Сгенерировать краткое описание статьи в 2–4 предложениях",
  },
  {
    id: "theses",
    label: "Тезисы",
    title: "Выделить главные мысли статьи списком тезисов",
  },
  {
    id: "telegram",
    label: "Пост для Telegram",
    title: "Создать готовый пост для публикации в Telegram",
  },
  {
    id: "translate",
    label: "Перевод",
    title: "Перевести статью на русский язык",
  },
  {
    id: "image",
    label: "Изображение",
    title: "Сгенерировать иллюстрацию по содержанию статьи",
  },
  {
    id: "plagiarism",
    label: "Плагиат",
    title: "Проверить текст на повторяющиеся и похожие фрагменты",
  },
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

function resolveErrorCode(error: unknown): ApiErrorCode {
  if (error instanceof ClientApiError) {
    return error.code;
  }

  return API_ERROR_CODES.SERVER_ERROR;
}

export default function ArticleAnalyzer() {
  const [url, setUrl] = useState("");
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<ApiErrorCode | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [processMessage, setProcessMessage] = useState<string | null>(null);

  async function handleAction(action: Action) {
    if (!isValidUrl(url)) {
      setErrorCode(API_ERROR_CODES.INVALID_URL);
      return;
    }

    setErrorCode(null);
    setCopied(false);
    setActiveAction(action);
    setLoading(true);
    setResult(null);

    const needsClientParse = action === "image" || action === "plagiarism";
    setProcessMessage(
      needsClientParse ? "Загружаю статью…" : LOADING_LABELS[action],
    );

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
        setProcessMessage(LOADING_LABELS.plagiarism);
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
        setProcessMessage(LOADING_LABELS.image);
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
      setErrorCode(resolveErrorCode(err));
    } finally {
      setLoading(false);
      setProcessMessage(null);
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-5 sm:gap-6 md:gap-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Referent
        </h1>
        <p className="break-words text-sm leading-relaxed text-slate-600 sm:text-base">
          Вставьте ссылку на англоязычную или русскоязычную статью и выберите
          действие.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
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
            setErrorCode(null);
          }}
          placeholder="Введите URL статьи, например: https://example.com/article"
          className="w-full min-w-0 rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm"
        />
        <p className="mt-1.5 break-words text-xs text-slate-500">
          Укажите ссылку на англоязычную статью
        </p>

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-3">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              title={action.title}
              onClick={() => handleAction(action.id)}
              disabled={!url.trim() || loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 md:w-auto"
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>

      {errorCode && !loading && (
        <ErrorAlert code={errorCode} className="min-w-0" />
      )}

      {loading && processMessage && (
        <div
          role="status"
          className="flex min-w-0 items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
        >
          <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
          <span className="min-w-0 break-words">{processMessage}</span>
        </div>
      )}

      <section
        aria-live="polite"
        className="min-h-48 min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 md:p-6"
      >
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
          Результат
        </h2>

        {!activeAction && !loading && (
          <p className="text-slate-500">
            Результат появится здесь после выбора действия.
          </p>
        )}

        {!loading && result?.type === "text" && (
          <p className="break-words whitespace-pre-wrap text-base leading-relaxed text-slate-800">
            {result.text}
          </p>
        )}

        {!loading && result?.type === "theses" && (
          <ol className="list-decimal space-y-2 break-words pl-4 text-slate-800 sm:pl-5">
            {result.items.map((item, index) => (
              <li key={index} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ol>
        )}

        {!loading && result?.type === "telegram" && (
          <div className="space-y-4">
            <p className="break-words whitespace-pre-wrap text-base leading-relaxed text-slate-800">
              {result.text}
            </p>
            <button
              type="button"
              onClick={() => handleCopy(result.text)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:w-auto"
            >
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
        )}

        {!loading && result?.type === "article" && (
          <article className="space-y-4 break-words">
            {result.data.date && (
              <time className="text-sm text-slate-500">{result.data.date}</time>
            )}
            <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
              {result.data.title}
            </h3>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">
              {result.data.content}
            </p>
          </article>
        )}

        {!loading && result?.type === "plagiarism" && (
          <div className="space-y-2 break-words">
            <p className="text-3xl font-semibold text-slate-900 sm:text-4xl">
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
              className="h-auto w-full max-w-full rounded-xl border border-slate-200"
            />
            <figcaption className="break-words text-sm text-slate-500">
              {result.alt}
            </figcaption>
          </figure>
        )}
      </section>
    </div>
  );
}
