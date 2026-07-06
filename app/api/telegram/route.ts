import { NextResponse } from "next/server";
import { parseUrlFromRequest } from "@/lib/api-url";
import { generateTelegramPost } from "@/lib/generate-telegram-post";
import { parseArticle } from "@/lib/parse-article";
import { toErrorResponse } from "@/lib/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const url = await parseUrlFromRequest(request);
    const article = await parseArticle(url);
    const result = await generateTelegramPost(article, url);

    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
