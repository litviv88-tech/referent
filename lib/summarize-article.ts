import { articlePayload, chatCompletion } from "./ai-text";
import type { ParsedArticle, SummaryResult } from "./types";

const SYSTEM_PROMPT =
  "Ты редактор. Кратко опиши, о чём статья: 2–4 предложения на русском языке. " +
  "Без заголовка, списков и markdown. Верни только текст описания.";

export async function summarizeArticle(
  article: ParsedArticle,
): Promise<SummaryResult> {
  const text = await chatCompletion(SYSTEM_PROMPT, articlePayload(article), 0.3);

  if (!text) {
    throw new Error("Не удалось сформировать описание статьи.");
  }

  return { text };
}
