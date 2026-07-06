import { NextResponse } from "next/server";
import { AppError, mapUnknownError } from "@/lib/errors";

export function toErrorResponse(error: unknown): NextResponse {
  const appError =
    error instanceof AppError ? error : mapUnknownError(error);

  return NextResponse.json({ code: appError.code }, { status: appError.status });
}
