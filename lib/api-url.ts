import { API_ERROR_CODES, AppError } from "./errors";

export async function parseUrlFromRequest(request: Request): Promise<string> {
  const body = (await request.json()) as { url?: string };
  const url = body.url?.trim();

  if (!url) {
    throw new AppError(API_ERROR_CODES.INVALID_URL, 400);
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new AppError(API_ERROR_CODES.INVALID_URL, 400);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(API_ERROR_CODES.INVALID_URL, 400);
  }

  return url;
}
