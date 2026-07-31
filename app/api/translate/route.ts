import { NextRequest, NextResponse } from "next/server";
import { parseArticle } from "@/lib/article";
import { translateArticle } from "@/lib/openrouter";
import { jsonError, requireUrl } from "@/lib/route-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = requireUrl(body.url);
    const { date, title, content } = await parseArticle(url);
    const { titleRu, contentRu } = await translateArticle(title, content);
    return NextResponse.json({
      date,
      title,
      titleRu,
      translation: contentRu,
    });
  } catch (e: unknown) {
    return jsonError(e);
  }
}
