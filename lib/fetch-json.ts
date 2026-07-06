export async function fetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(
      "Не удалось связаться с API. Запустите сервер: npm run dev",
    );
  }

  const text = await response.text();
  const trimmed = text.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const data = JSON.parse(trimmed) as T & { error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? `Ошибка запроса: HTTP ${response.status}`);
    }

    return data;
  }

  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    throw new Error(
      "Ошибка сервера API. Подождите минуту и попробуйте снова. Если ошибка повторяется — перезапустите деплой на Vercel.",
    );
  }

  throw new Error(trimmed.slice(0, 200) || "API вернул неожиданный ответ.");
}
