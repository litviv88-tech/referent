export const API_ERROR_CODES = {
  INVALID_URL: "INVALID_URL",
  ARTICLE_FETCH_FAILED: "ARTICLE_FETCH_FAILED",
  ARTICLE_PARSE_FAILED: "ARTICLE_PARSE_FAILED",
  MISSING_CONTENT: "MISSING_CONTENT",
  MISSING_API_KEY: "MISSING_API_KEY",
  AI_UNAVAILABLE: "AI_UNAVAILABLE",
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export type ErrorDisplay = {
  title: string;
  description?: string;
};

export const ERROR_DISPLAY: Record<ApiErrorCode, ErrorDisplay> = {
  INVALID_URL: {
    title: "Некорректная ссылка",
    description:
      "Введите адрес статьи, начинающийся с http:// или https://",
  },
  ARTICLE_FETCH_FAILED: {
    title: "Не удалось загрузить статью по этой ссылке.",
    description:
      "Сайт может быть недоступен, блокировать загрузку или ссылка устарела.",
  },
  ARTICLE_PARSE_FAILED: {
    title: "Не удалось разобрать статью",
    description:
      "На странице не найден текст статьи. Попробуйте другую ссылку.",
  },
  MISSING_CONTENT: {
    title: "Недостаточно данных",
    description: "В статье не найден текст для обработки.",
  },
  MISSING_API_KEY: {
    title: "Сервис AI не настроен",
    description:
      "Добавьте OPENROUTER_API_KEY в .env.local и перезапустите сервер.",
  },
  AI_UNAVAILABLE: {
    title: "Не удалось выполнить запрос к AI",
    description: "Попробуйте ещё раз через минуту.",
  },
  NETWORK_ERROR: {
    title: "Нет связи с сервером",
    description:
      "Проверьте подключение к интернету или перезапустите локальный сервер.",
  },
  SERVER_ERROR: {
    title: "Что-то пошло не так",
    description: "Попробуйте ещё раз или выберите другое действие.",
  },
};

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, status = 500, message?: string) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export class ClientApiError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode) {
    super(code);
    this.name = "ClientApiError";
    this.code = code;
  }
}

export function getErrorDisplay(code: ApiErrorCode): ErrorDisplay {
  return ERROR_DISPLAY[code] ?? ERROR_DISPLAY.SERVER_ERROR;
}

function isArticleFetchMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("не удалось загрузить") ||
    lower.includes("fetch failed") ||
    lower.includes("таймаут") ||
    lower.includes("timeout") ||
    lower.includes("недоступен") ||
    lower.includes("http 4") ||
    lower.includes("http 5") ||
    lower.includes("подключиться")
  );
}

function isArticleParseMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("извлечь") ||
    lower.includes("разобрать") ||
    lower.includes("содержимое статьи")
  );
}

function isApiKeyMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("openrouter_api_key") ||
    lower.includes("authentication") ||
    lower.includes("api key") ||
    lower.includes("missing authentication")
  );
}

export function mapUnknownError(
  error: unknown,
  fallback: ApiErrorCode = API_ERROR_CODES.SERVER_ERROR,
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ClientApiError) {
    return new AppError(error.code, 500);
  }

  if (error instanceof Error) {
    const message = error.message;

    if (isApiKeyMessage(message)) {
      return new AppError(API_ERROR_CODES.MISSING_API_KEY, 500, message);
    }

    if (isArticleFetchMessage(message)) {
      return new AppError(API_ERROR_CODES.ARTICLE_FETCH_FAILED, 502, message);
    }

    if (isArticleParseMessage(message)) {
      return new AppError(API_ERROR_CODES.ARTICLE_PARSE_FAILED, 422, message);
    }

    if (
      message.toLowerCase().includes("openrouter") ||
      message.toLowerCase().includes("модель")
    ) {
      return new AppError(API_ERROR_CODES.AI_UNAVAILABLE, 502, message);
    }
  }

  return new AppError(fallback, 500);
}
