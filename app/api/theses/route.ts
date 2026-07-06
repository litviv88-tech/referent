import { NextResponse } from "next/server";
import { parseUrlFromRequest } from "@/lib/api-url";
import { generateTheses } from "@/lib/generate-theses";
import { parseArticle } from "@/lib/parse-article";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const url = await parseUrlFromRequest(request);
    const article = await parseArticle(url);
    const result = await generateTheses(article);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка формирования тезисов.";
    const status = message.includes("URL") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
