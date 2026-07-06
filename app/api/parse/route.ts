import { NextResponse } from "next/server";
import { parseArticle } from "@/lib/parse-article";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "URL обязателен." }, { status: 400 });
    }

    const article = await parseArticle(url);
    return NextResponse.json(article);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка парсинга статьи.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
