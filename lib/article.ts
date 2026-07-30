import * as cheerio from "cheerio";

export type ParsedArticle = {
  date: string;
  title: string;
  content: string;
};

export async function parseArticle(url: string): Promise<ParsedArticle> {
  const html = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
  }).then((r) => {
    if (!r.ok) throw new Error(`Не удалось загрузить страницу: ${r.status}`);
    return r.text();
  });

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
      : $(".post-content, .post-body, .entry-content, .article-body, .content, .story-body, main").first();

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

  return { date, title, content };
}
