import { NextResponse } from "next/server";
import { generateArticleImage } from "@/lib/generate-image";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { title?: string; content?: string };
    const title = body.title?.trim() ?? "";
    const content = body.content?.trim() ?? "";

    if (!title && !content) {
      return NextResponse.json(
        { error: "Нужен заголовок или текст статьи." },
        { status: 400 },
      );
    }

    const result = await generateArticleImage(title, content);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка генерации изображения.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
