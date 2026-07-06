export async function parseUrlFromRequest(request: Request): Promise<string> {
  const body = (await request.json()) as { url?: string };
  const url = body.url?.trim();

  if (!url) {
    throw new Error("URL обязателен.");
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Некорректный URL.");
    }
  } catch {
    throw new Error("Некорректный URL.");
  }

  return url;
}
