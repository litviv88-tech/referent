import { NextResponse } from "next/server";
import { parseUrlFromRequest } from "@/lib/api-url";
import { parseArticle } from "@/lib/parse-article";
import { toErrorResponse } from "@/lib/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const url = await parseUrlFromRequest(request);
    const article = await parseArticle(url);
    return NextResponse.json(article);
  } catch (error) {
    return toErrorResponse(error);
  }
}
