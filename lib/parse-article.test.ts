import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  extractContentFromHtml,
  extractDateFromHtml,
  extractTitleFromHtml,
  normalizeText,
  parseArticleHtml,
} from "./parse-article";

const fixtureHtml = readFileSync(
  join(import.meta.dirname, "fixtures", "sample-article.html"),
  "utf-8",
);

describe("normalizeText", () => {
  it("убирает лишние пробелы", () => {
    assert.equal(normalizeText("  hello   world  "), "hello world");
  });
});

describe("extractTitleFromHtml", () => {
  it("берёт og:title", () => {
    assert.equal(extractTitleFromHtml(fixtureHtml), "Заголовок из og:title");
  });
});

describe("extractDateFromHtml", () => {
  it("берёт datetime из time", () => {
    assert.equal(
      extractDateFromHtml(fixtureHtml),
      "2024-03-14T09:30:00+03:00",
    );
  });
});

describe("extractContentFromHtml", () => {
  it("извлекает текст из article без header/footer", () => {
    const content = extractContentFromHtml(fixtureHtml);

    assert.match(content, /первый абзац тестовой статьи/);
    assert.match(content, /Второй абзац дополняет контекст/);
    assert.doesNotMatch(content, /Навигация сайта/);
    assert.doesNotMatch(content, /Подвал сайта/);
    assert.ok(content.length >= 200);
  });
});

describe("parseArticleHtml", () => {
  it("возвращает JSON { date, title, content }", async () => {
    const result = await parseArticleHtml(
      fixtureHtml,
      "https://example.com/article",
    );

    assert.equal(result.title, "Заголовок из og:title");
    assert.ok(result.date);
    assert.match(result.date!, /2024-03-1[45]/);
    assert.ok(result.content.length >= 200);
    assert.match(result.content, /первый абзац/);
  });
});
