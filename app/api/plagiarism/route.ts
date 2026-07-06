import { NextResponse } from "next/server";
import { API_ERROR_CODES, AppError } from "@/lib/errors";
import { checkPlagiarism } from "@/lib/plagiarism";
import { toErrorResponse } from "@/lib/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim();

    if (!content) {
      throw new AppError(API_ERROR_CODES.MISSING_CONTENT, 400);
    }

    const result = await checkPlagiarism(content);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
