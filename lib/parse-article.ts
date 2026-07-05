import * as cheerio from "cheerio";
import metascraper from "metascraper";
import metascraperTitle from "metascraper-title";
import metascraperDate from "metascraper-date";
import type { ParsedArticle } from "./types";

const scraper = metascraper([metascraperTitle(), metascraperDate()]);

export const CONTENT_SELECTORS = [
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

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
};

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function extractTitleFromHtml(html: string): string {
  const $ = cheerio.load(html);
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

export function extractDateFromHtml(html: string): string | null {
  const $ = cheerio.load(html);

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

export function extractContentFromHtml(html: string): string {
  const $ = cheerio.load(html);
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

export async function parseArticleHtml(
  html: string,
  url: string,
): Promise<ParsedArticle> {
  const metadata = await scraper({ html, url });

  const title =
    normalizeText(metadata.title ?? "") || extractTitleFromHtml(html);
  const date = metadata.date
    ? normalizeText(metadata.date)
    : extractDateFromHtml(html);
  const content = extractContentFromHtml(html);

  if (!title && !content) {
    throw new Error("Не удалось извлечь заголовок и содержимое статьи.");
  }

  return { date, title, content };
}

function formatFetchError(error: unknown, url: string): string {
  if (!(error instanceof Error)) {
    return "Не удалось загрузить страницу.";
  }

  const cause = error.cause as { code?: string } | undefined;

  if (cause?.code === "UND_ERR_CONNECT_TIMEOUT") {
    return `Сайт ${new URL(url).hostname} недоступен с сервера (таймаут). Попробуйте другой URL или проверьте VPN/сеть.`;
  }

  if (error.message === "fetch failed") {
    return `Не удалось подключиться к ${new URL(url).hostname}. Проверьте URL и доступность сайта.`;
  }

  if (error.name === "TimeoutError") {
    return "Превышено время ожидания ответа от сайта (15 с).";
  }

  return error.message;
}

export async function parseArticle(url: string): Promise<ParsedArticle> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(20000),
      redirect: "follow",
    });
  } catch (error) {
    throw new Error(formatFetchError(error, url));
  }

  if (!response.ok) {
    throw new Error(`Не удалось загрузить страницу: HTTP ${response.status}`);
  }

  const html = await response.text();
  return parseArticleHtml(html, url);
}
