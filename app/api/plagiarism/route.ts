import { NextResponse } from "next/server";
import { checkPlagiarism } from "@/lib/plagiarism";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: "Текст статьи обязателен." },
        { status: 400 },
      );
    }

    const result = await checkPlagiarism(content);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка проверки на плагиат.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
