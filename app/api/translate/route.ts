import { NextResponse } from "next/server";
import { parseArticle } from "@/lib/parse-article";
import { translateArticle } from "@/lib/translate-article";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "URL обязателен." }, { status: 400 });
    }

    const article = await parseArticle(url);
    const translated = await translateArticle(article);

    return NextResponse.json(translated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка перевода статьи.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
