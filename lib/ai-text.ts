import { createOpenRouterClient } from "./openrouter";
import type { ParsedArticle } from "./types";

export const CONTENT_LIMIT = 12000;

const DEFAULT_TEXT_MODEL = "poolside/laguna-xs-2.1";

export function getTextModel(): string {
  return (
    process.env.OPENROUTER_TEXT_MODEL ??
    process.env.OPENROUTER_TRANSLATE_MODEL ??
    DEFAULT_TEXT_MODEL
  );
}

export function trimArticleContent(article: ParsedArticle): ParsedArticle {
  return {
    ...article,
    content: article.content.slice(0, CONTENT_LIMIT),
  };
}

export async function chatCompletion(
  system: string,
  user: string,
  temperature = 0.3,
): Promise<string> {
  const client = createOpenRouterClient();
  const response = await client.chat.completions.create({
    model: getTextModel(),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
  });

  const text = response.choices[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("Модель не вернула текст.");
  }

  return text;
}

export function extractJsonObject<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("Модель не вернула JSON.");
  }

  return JSON.parse(match[0]) as T;
}

export function articlePayload(article: ParsedArticle): string {
  const trimmed = trimArticleContent(article);

  return JSON.stringify({
    date: trimmed.date,
    title: trimmed.title,
    content: trimmed.content,
  });
}
