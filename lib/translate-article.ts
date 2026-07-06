import { createOpenRouterClient } from "./openrouter";
import type { ParsedArticle } from "./types";

const TRANSLATE_MODEL =
  process.env.OPENROUTER_TRANSLATE_MODEL ?? "poolside/laguna-xs-2.1";

function extractJson(text: string): ParsedArticle {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("Модель не вернула JSON с переводом.");
  }

  const parsed = JSON.parse(match[0]) as ParsedArticle;

  if (!parsed.title && !parsed.content) {
    throw new Error("В ответе модели нет перевода статьи.");
  }

  return {
    date: parsed.date ?? null,
    title: parsed.title ?? "",
    content: parsed.content ?? "",
  };
}

export async function translateArticle(
  article: ParsedArticle,
): Promise<ParsedArticle> {
  const client = createOpenRouterClient();
  const excerpt = article.content.slice(0, 12000);

  const response = await client.chat.completions.create({
    model: TRANSLATE_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Переведи статью на русский язык. Верни только JSON без markdown: { \"date\": string|null, \"title\": string, \"content\": string }. Сохрани дату как есть, если она уже есть.",
      },
      {
        role: "user",
        content: JSON.stringify({
          date: article.date,
          title: article.title,
          content: excerpt,
        }),
      },
    ],
    temperature: 0.2,
  });

  const text = response.choices[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("Модель перевода не вернула текст.");
  }

  return extractJson(text);
}
