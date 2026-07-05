import OpenAI from "openai";
import type { ImageResult } from "./types";

function buildPrompt(title: string, content: string): string {
  const excerpt = content.slice(0, 400).trim();
  return [
    "Create a clean editorial illustration for a news article.",
    `Title: ${title}`,
    excerpt ? `Context: ${excerpt}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateArticleImage(
  title: string,
  content: string,
): Promise<ImageResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Укажите OPENAI_API_KEY в .env.local для генерации изображений.",
    );
  }

  const openai = new OpenAI({ apiKey });
  const prompt = buildPrompt(title, content);

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
  });

  const url = response.data?.[0]?.url;

  if (!url) {
    throw new Error("OpenAI не вернул URL изображения.");
  }

  return {
    url,
    alt: `Иллюстрация к статье: ${title}`,
  };
}
