import { NextRequest, NextResponse } from "next/server";
import { parseArticle } from "@/lib/article";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL обязателен" }, { status: 400 });
    }

    const { date, title, content } = await parseArticle(url);

    return NextResponse.json({ date, title, content });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
