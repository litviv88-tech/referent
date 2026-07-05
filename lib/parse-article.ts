import * as cheerio from "cheerio";
import metascraper from "metascraper";
import metascraperTitle from "metascraper-title";
import metascraperDate from "metascraper-date";
import type { ParsedArticle } from "./types";

const scraper = metascraper([metascraperTitle(), metascraperDate()]);

const CONTENT_SELECTORS = [
  "article",
  "main",
  '[role="main"]',
  ".post-content",
  ".entry-content",
  ".article-content",
  ".article-body",
  ".content",
  ".post",
  ".article",
  "#content",
  ".story-body",
];

const DATE_SELECTORS = [
  "time[datetime]",
  'meta[property="article:published_time"]',
  'meta[name="pubdate"]',
  'meta[name="date"]',
  ".date",
  ".published",
  ".post-date",
  ".article-date",
];

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractTitle($: cheerio.CheerioAPI): string {
  const candidates = [
    $('meta[property="og:title"]').attr("content"),
    $('meta[name="twitter:title"]').attr("content"),
    $("h1").first().text(),
    $("title").text(),
  ];

  for (const candidate of candidates) {
    const title = normalizeText(candidate ?? "");
    if (title.length > 0) {
      return title;
    }
  }

  return "";
}

function extractDate($: cheerio.CheerioAPI): string | null {
  for (const selector of DATE_SELECTORS) {
    const element = $(selector).first();
    if (!element.length) {
      continue;
    }

    const value =
      element.attr("datetime") ??
      element.attr("content") ??
      element.text();

    const date = normalizeText(value ?? "");
    if (date.length > 0) {
      return date;
    }
  }

  return null;
}

function extractContent($: cheerio.CheerioAPI): string {
  const clone = cheerio.load($.html());

  clone("script, style, noscript, iframe, svg, nav, footer, header").remove();

  for (const selector of CONTENT_SELECTORS) {
    const element = clone(selector).first();
    if (!element.length) {
      continue;
    }

    const text = normalizeText(element.text());
    if (text.length >= 200) {
      return text;
    }
  }

  return normalizeText(clone("body").text());
}

export async function parseArticle(url: string): Promise<ParsedArticle> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Referent/1.0; +https://github.com/referent)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить страницу: HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const metadata = await scraper({ html, url });

  const title = normalizeText(metadata.title ?? "") || extractTitle($);
  const date = metadata.date ? normalizeText(metadata.date) : extractDate($);
  const content = extractContent($);

  if (!title && !content) {
    throw new Error("Не удалось извлечь заголовок и содержимое статьи.");
  }

  return { date, title, content };
}
