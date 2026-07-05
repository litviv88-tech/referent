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

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();

    if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
      throw new Error(
        "API вернул HTML вместо JSON. Пересоберите проект (npm run build) и перезапустите сервер (npm run dev).",
      );
    }

    throw new Error(text.slice(0, 200) || "API вернул неожиданный ответ.");
  }

  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? `Ошибка запроса: HTTP ${response.status}`);
  }

  return data;
}
