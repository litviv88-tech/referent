import { articlePayload, chatCompletion } from "./ai-text";
import type { ParsedArticle, TelegramPostResult } from "./types";

const SYSTEM_PROMPT =
  "Создай пост для Telegram на русском языке: цепляющая первая строка, " +
  "короткие абзацы, 1–2 уместных эмодзи. В конце обязательно добавь ссылку на источник. " +
  "До 3000 символов. Верни только текст поста, без пояснений.";

export async function generateTelegramPost(
  article: ParsedArticle,
  sourceUrl: string,
): Promise<TelegramPostResult> {
  const user = JSON.stringify({
    sourceUrl,
    article: JSON.parse(articlePayload(article)) as ParsedArticle,
  });

  const text = await chatCompletion(SYSTEM_PROMPT, user, 0.4);

  if (!text) {
    throw new Error("Не удалось сформировать пост для Telegram.");
  }

  return { text };
}
