import { NextResponse } from "next/server";
import { API_ERROR_CODES, AppError } from "@/lib/errors";
import { generateArticleImage } from "@/lib/generate-image";
import { toErrorResponse } from "@/lib/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { title?: string; content?: string };
    const title = body.title?.trim() ?? "";
    const content = body.content?.trim() ?? "";

    if (!title && !content) {
      throw new AppError(API_ERROR_CODES.MISSING_CONTENT, 400);
    }

    const result = await generateArticleImage(title, content);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
