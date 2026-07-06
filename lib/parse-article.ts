import * as cheerio from "cheerio";
import { API_ERROR_CODES, AppError } from "./errors";
import type { ParsedArticle } from "./types";

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
  ".l-entry__content",
  ".content--full",
];

const DATE_SELECTORS = [
  "time[datetime]",
  'meta[property="article:published_time"]',
  'meta[property="og:updated_time"]',
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
  _url: string,
): Promise<ParsedArticle> {
  const title = extractTitleFromHtml(html);
  const date = extractDateFromHtml(html);
  const content = extractContentFromHtml(html);

  if (!title && !content) {
    throw new AppError(API_ERROR_CODES.ARTICLE_PARSE_FAILED, 422);
  }

  return { date, title, content };
}

export async function parseArticle(url: string): Promise<ParsedArticle> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(20000),
      redirect: "follow",
    });
  } catch {
    throw new AppError(API_ERROR_CODES.ARTICLE_FETCH_FAILED, 502);
  }

  if (!response.ok) {
    throw new AppError(API_ERROR_CODES.ARTICLE_FETCH_FAILED, 502);
  }

  const html = await response.text();
  return parseArticleHtml(html, url);
}
