import OpenAI from "openai";
import { API_ERROR_CODES, AppError } from "./errors";

function sanitizeApiKey(raw: string): string {
  let key = raw.trim();

  // Частая ошибка: вставка команды export OPENROUTER_API_KEY=sk-...
  key = key.replace(/^export\s+OPENROUTER_API_KEY\s*=\s*/i, "");
  key = key.replace(/^OPENROUTER_API_KEY\s*=\s*/i, "");
  key = key.replace(/^["']|["']$/g, "");

  return key.trim();
}

export function getOpenRouterApiKey(): string {
  const raw =
    process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
  const apiKey = sanitizeApiKey(raw);

  if (!apiKey || apiKey.includes("...") || apiKey.length < 20) {
    throw new AppError(API_ERROR_CODES.MISSING_API_KEY, 500);
  }

  return apiKey;
}

export function getOpenRouterBaseUrl(): string {
  return (
    process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ??
    "https://openrouter.ai/api/v1"
  );
}

export function getOpenRouterHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getOpenRouterApiKey()}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
    "X-Title": "Referent",
  };
}

export function createOpenRouterClient(): OpenAI {
  return new OpenAI({
    apiKey: getOpenRouterApiKey(),
    baseURL: getOpenRouterBaseUrl(),
  });
}

export async function openRouterFetch<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${getOpenRouterBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...getOpenRouterHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  const text = await response.text();
  const trimmed = text.trim();

  if (!response.ok) {
    throw new AppError(API_ERROR_CODES.AI_UNAVAILABLE, 502);
  }

  if (!trimmed) {
    throw new AppError(API_ERROR_CODES.AI_UNAVAILABLE, 502);
  }

  return JSON.parse(trimmed) as T;
}
