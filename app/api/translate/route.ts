import { NextRequest, NextResponse } from "next/server";
import { parseArticle } from "@/lib/article";
import { translateArticle } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL обязателен" }, { status: 400 });
    }

    const { date, title, content } = await parseArticle(url);

    if (!content) {
      return NextResponse.json(
        { error: "Не удалось извлечь текст статьи" },
        { status: 422 }
      );
    }

    const { titleRu, contentRu } = await translateArticle(title, content);

    return NextResponse.json({
      date,
      title,
      titleRu,
      translation: contentRu,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
