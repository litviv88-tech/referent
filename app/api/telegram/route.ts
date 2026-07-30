import { NextRequest, NextResponse } from "next/server";
import { parseArticle } from "@/lib/article";
import { generateTelegramPost } from "@/lib/openrouter";

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

    const text = await generateTelegramPost(title, content, url.trim());

    return NextResponse.json({ date, title, text });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
