import { NextResponse } from "next/server";
import { AppError, errorResponse } from "@/lib/errors";

export function requireUrl(url: unknown): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    throw new AppError("INVALID_URL", 400);
  }

  try {
    const parsed = new URL(url.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new AppError("INVALID_URL", 400);
    }
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError("INVALID_URL", 400);
  }

  return url.trim();
}

export function jsonError(error: unknown) {
  const { body, status } = errorResponse(error);
  return NextResponse.json(body, { status });
}
