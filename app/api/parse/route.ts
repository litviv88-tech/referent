import { NextRequest, NextResponse } from "next/server";
import { parseArticle } from "@/lib/article";
import { jsonError, requireUrl } from "@/lib/route-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = requireUrl(body.url);
    const { date, title, content } = await parseArticle(url);
    return NextResponse.json({ date, title, content });
  } catch (e: unknown) {
    return jsonError(e);
  }
}
