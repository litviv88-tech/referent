import {
  API_ERROR_CODES,
  ClientApiError,
  type ApiErrorCode,
} from "./errors";

type ApiErrorPayload = {
  code?: ApiErrorCode;
};

function parseErrorCode(payload: ApiErrorPayload): ApiErrorCode {
  if (payload.code && payload.code in API_ERROR_CODES) {
    return payload.code;
  }

  return API_ERROR_CODES.SERVER_ERROR;
}

export async function fetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch {
    throw new ClientApiError(API_ERROR_CODES.NETWORK_ERROR);
  }

  const text = await response.text();
  const trimmed = text.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const data = JSON.parse(trimmed) as T & ApiErrorPayload;

    if (!response.ok) {
      throw new ClientApiError(parseErrorCode(data));
    }

    return data;
  }

  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    throw new ClientApiError(API_ERROR_CODES.SERVER_ERROR);
  }

  throw new ClientApiError(API_ERROR_CODES.SERVER_ERROR);
}
