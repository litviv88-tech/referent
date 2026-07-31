export type AppErrorCode =
  | "INVALID_URL"
  | "ARTICLE_FETCH_FAILED"
  | "ARTICLE_EMPTY"
  | "AI_NOT_CONFIGURED"
  | "AI_FAILED"
  | "UNKNOWN";

export class AppError extends Error {
  code: AppErrorCode;
  status: number;

  constructor(code: AppErrorCode, status: number, message?: string) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

const FRIENDLY: Record<AppErrorCode, string> = {
  INVALID_URL: "Укажите корректную ссылку на статью.",
  ARTICLE_FETCH_FAILED: "Не удалось загрузить статью по этой ссылке.",
  ARTICLE_EMPTY:
    "Не удалось извлечь текст статьи. Попробуйте другую ссылку.",
  AI_NOT_CONFIGURED:
    "Сервис ИИ временно недоступен. Проверьте настройки ключа.",
  AI_FAILED: "Не удалось обработать статью с помощью ИИ. Попробуйте ещё раз.",
  UNKNOWN: "Что-то пошло не так. Попробуйте ещё раз чуть позже.",
};

export function friendlyMessage(code: AppErrorCode): string {
  return FRIENDLY[code] ?? FRIENDLY.UNKNOWN;
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("timeout") ||
    lower.includes("aborted") ||
    lower.includes("timed out") ||
    lower.includes("fetch failed") ||
    lower.includes("network") ||
    lower.includes("econnreset") ||
    lower.includes("enotfound") ||
    /не удалось загрузить страницу:\s*(404|408|429|5\d\d)/i.test(message)
  ) {
    return new AppError("ARTICLE_FETCH_FAILED", 502);
  }

  if (message.includes("OPENROUTER_API_KEY")) {
    return new AppError("AI_NOT_CONFIGURED", 503);
  }

  if (
    lower.includes("openrouter") ||
    lower.includes("перевод") ||
    lower.includes("не вернул")
  ) {
    return new AppError("AI_FAILED", 502);
  }

  return new AppError("UNKNOWN", 500);
}

export function errorResponse(error: unknown) {
  const appError = toAppError(error);
  return {
    body: {
      error: friendlyMessage(appError.code),
      code: appError.code,
    },
    status: appError.status,
  };
}
