import * as cheerio from "cheerio";
import { AppError } from "@/lib/errors";

export type ParsedArticle = {
  date: string;
  title: string;
  content: string;
};

const FETCH_TIMEOUT_MS = 15000;

export async function parseArticle(url: string): Promise<ParsedArticle> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    });
  } catch {
    throw new AppError("ARTICLE_FETCH_FAILED", 502);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new AppError("ARTICLE_FETCH_FAILED", 502);
  }

  let html: string;
  try {
    html = await response.text();
  } catch {
    throw new AppError("ARTICLE_FETCH_FAILED", 502);
  }

  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, aside, iframe, noscript").remove();

  const title =
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
    "";

  const date =
    $("time").first().attr("datetime") ||
    $("time").first().text().trim() ||
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[name="date"]').attr("content") ||
    "";

  const contentEl =
    $("article").first().length > 0
      ? $("article").first()
      : $(
          ".post-content, .post-body, .entry-content, .article-body, .content, .story-body, main"
        ).first();

  let content = "";
  if (contentEl.length > 0) {
    content = contentEl
      .find("p")
      .map((_i, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 20)
      .join("\n\n");
  }

  if (!content) {
    content = $("p")
      .map((_i, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 20)
      .join("\n\n");
  }

  if (!content.trim()) {
    throw new AppError("ARTICLE_EMPTY", 422);
  }

  return { date, title, content };
}
