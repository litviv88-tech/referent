import { articlePayload, chatCompletion, extractJsonObject } from "./ai-text";
import type { ParsedArticle, ThesesResult } from "./types";

const SYSTEM_PROMPT =
  "Выдели 5–10 главных тезисов статьи на русском языке. " +
  'Верни только JSON без markdown: { "items": ["тезис 1", "тезис 2"] }. ' +
  "Каждый тезис — одно короткое предложение.";

type ThesesJson = { items?: string[] };

export async function generateTheses(
  article: ParsedArticle,
): Promise<ThesesResult> {
  const raw = await chatCompletion(SYSTEM_PROMPT, articlePayload(article), 0.2);
  const parsed = extractJsonObject<ThesesJson>(raw);
  const items = (parsed.items ?? [])
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length === 0) {
    throw new Error("Модель не вернула тезисы.");
  }

  return { items };
}
