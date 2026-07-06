import { NextResponse } from "next/server";
import { parseUrlFromRequest } from "@/lib/api-url";
import { parseArticle } from "@/lib/parse-article";
import { toErrorResponse } from "@/lib/route-error";
import { translateArticle } from "@/lib/translate-article";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const url = await parseUrlFromRequest(request);
    const article = await parseArticle(url);
    const translated = await translateArticle(article);

    return NextResponse.json(translated);
  } catch (error) {
    return toErrorResponse(error);
  }
}
