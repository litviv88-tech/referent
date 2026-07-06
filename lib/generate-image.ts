import { API_ERROR_CODES, AppError } from "./errors";
import { getOpenRouterBaseUrl, getOpenRouterHeaders } from "./openrouter";
import type { ImageResult } from "./types";

const DEFAULT_IMAGE_MODEL = "x-ai/grok-imagine-image-quality";

function getImageModel(): string {
  const model = process.env.OPENROUTER_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL;

  if (model === "openrouter/auto") {
    throw new AppError(API_ERROR_CODES.AI_UNAVAILABLE, 500);
  }

  return model;
}

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

type ImageApiResponse = {
  data?: Array<{ url?: string; b64_json?: string }>;
};

export async function generateArticleImage(
  title: string,
  content: string,
): Promise<ImageResult> {
  const prompt = buildPrompt(title, content);
  const model = getImageModel();
  const baseUrl = getOpenRouterBaseUrl();

  const response = await fetch(`${baseUrl}/images`, {
    method: "POST",
    headers: getOpenRouterHeaders(),
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      resolution: "1K",
      aspect_ratio: "16:9",
    }),
  });

  const text = await response.text();
  const trimmed = text.trim();

  if (!response.ok) {
    throw new AppError(API_ERROR_CODES.AI_UNAVAILABLE, 502);
  }

  const data = JSON.parse(trimmed) as ImageApiResponse;
  const image = data.data?.[0];
  const url =
    image?.url ??
    (image?.b64_json ? `data:image/png;base64,${image.b64_json}` : null);

  if (!url) {
    throw new AppError(API_ERROR_CODES.AI_UNAVAILABLE, 502);
  }

  return {
    url,
    alt: `Иллюстрация к статье: ${title}`,
  };
}
