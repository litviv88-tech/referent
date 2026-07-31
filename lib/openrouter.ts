import { AppError } from "@/lib/errors";

const MODEL = "deepseek/deepseek-chat";
const MAX_CONTENT_LENGTH = 12000;

export type TranslationResult = {
  titleRu: string;
  contentRu: string;
};

function getConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey || apiKey === "your_api_key_here") {
    throw new AppError("AI_NOT_CONFIGURED", 503);
  }

  return { apiKey, baseUrl };
}

function trimContent(content: string) {
  return content.length > MAX_CONTENT_LENGTH
    ? content.slice(0, MAX_CONTENT_LENGTH) + "…"
    : content;
}

async function chatCompletion(
  system: string,
  user: string,
  json = false
): Promise<string> {
  const { apiKey, baseUrl } = getConfig();

  const body: Record<string, unknown> = {
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  if (json) {
    body.response_format = { type: "json_object" };
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://referent-alex3333.vercel.app",
        "X-Title": "Referent",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AppError("AI_FAILED", 502);
  }

  if (!response.ok) {
    throw new AppError("AI_FAILED", 502);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new AppError("AI_FAILED", 502);
  }

  return content;
}

export async function translateArticle(
  title: string,
  content: string
): Promise<TranslationResult> {
  const raw = await chatCompletion(
    'Ты профессиональный переводчик. Переводи англоязычные статьи на русский язык точно и естественно. Сохраняй структуру текста. Отвечай только JSON: {"titleRu":"перевод заголовка","contentRu":"перевод текста"}',
    `Переведи на русский язык следующую статью.\n\nЗаголовок: ${title}\n\nТекст:\n${trimContent(content)}`,
    true
  );

  let parsed: { titleRu?: string; contentRu?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError("AI_FAILED", 502);
  }

  if (!parsed.titleRu || !parsed.contentRu) {
    throw new AppError("AI_FAILED", 502);
  }

  return { titleRu: parsed.titleRu, contentRu: parsed.contentRu };
}

export async function summarizeArticle(
  title: string,
  content: string
): Promise<string> {
  return chatCompletion(
    "Ты редактор. Кратко опиши, о чём статья, на русском языке в 2–4 предложениях. Без вступлений и списков — только связный текст.",
    `Заголовок: ${title}\n\nТекст:\n${trimContent(content)}`
  );
}

export async function generateTheses(
  title: string,
  content: string
): Promise<string> {
  return chatCompletion(
    "Ты аналитик. Составь 5–10 ключевых тезисов статьи на русском языке. Каждый тезис — отдельная строка, начинающаяся с «• ». Без вступлений.",
    `Заголовок: ${title}\n\nТекст:\n${trimContent(content)}`
  );
}

export async function generateTelegramPost(
  title: string,
  content: string,
  sourceUrl: string
): Promise<string> {
  const post = await chatCompletion(
    "Ты автор постов для Telegram. Напиши короткий живой пост на русском (до 800 символов) по статье: цепляющее начало, суть, без кликбейта и без хэштегов. Не добавляй ссылку на источник — она будет добавлена отдельно.",
    `Заголовок: ${title}\n\nТекст:\n${trimContent(content)}`
  );

  const cleaned = post.trim().replace(/\n{3,}/g, "\n\n");
  return `${cleaned}\n\nИсточник: ${sourceUrl}`;
}
