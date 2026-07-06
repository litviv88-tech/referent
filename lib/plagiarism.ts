import { compareTwoStrings } from "string-similarity";
import { openRouterFetch } from "./openrouter";
import type { PlagiarismResult } from "./types";

const PLAGIARISM_MODEL =
  process.env.OPENROUTER_PLAGIARISM_MODEL ??
  "nvidia/llama-nemotron-reranker-1b-v2";

const SIMILARITY_THRESHOLD = 0.85;
const RERANK_THRESHOLD = 0.8;
const MAX_SENTENCES = 20;
const MAX_CHECKS = 8;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30)
    .slice(0, MAX_SENTENCES);
}

function checkPlagiarismLocal(content: string): PlagiarismResult {
  const sentences = splitSentences(content);

  if (sentences.length < 2) {
    return {
      percent: 0,
      method: "local",
      details: "Недостаточно текста для локального анализа.",
    };
  }

  let similarPairs = 0;
  let totalPairs = 0;

  for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
      totalPairs++;
      const score = compareTwoStrings(
        sentences[i].toLowerCase(),
        sentences[j].toLowerCase(),
      );
      if (score >= SIMILARITY_THRESHOLD) {
        similarPairs++;
      }
    }
  }

  const percent =
    totalPairs > 0 ? Math.round((similarPairs / totalPairs) * 100) : 0;

  return {
    percent,
    method: "local",
    details:
      similarPairs > 0
        ? `Найдено ${similarPairs} пар похожих предложений (локальный анализ).`
        : "Явных повторов и дубликатов предложений не обнаружено.",
  };
}

type RerankResponse = {
  results?: Array<{ index: number; relevance_score: number }>;
};

async function rerankSimilarity(
  query: string,
  documents: string[],
): Promise<number> {
  const data = await openRouterFetch<RerankResponse>("/rerank", {
    method: "POST",
    body: JSON.stringify({
      model: PLAGIARISM_MODEL,
      query,
      documents,
      top_n: Math.min(3, documents.length),
    }),
  });

  return data.results?.[0]?.relevance_score ?? 0;
}

async function checkPlagiarismOpenRouter(
  content: string,
): Promise<PlagiarismResult> {
  const sentences = splitSentences(content);

  if (sentences.length < 2) {
    return {
      percent: 0,
      method: "openrouter-rerank",
      details: "Недостаточно текста для анализа через rerank-модель.",
    };
  }

  let similarChecks = 0;
  let totalChecks = 0;

  for (let i = 0; i < Math.min(sentences.length, MAX_CHECKS); i++) {
    const others = sentences.filter((_, index) => index !== i);

    if (others.length === 0) {
      continue;
    }

    const score = await rerankSimilarity(sentences[i], others);
    totalChecks++;

    if (score >= RERANK_THRESHOLD) {
      similarChecks++;
    }
  }

  const percent =
    totalChecks > 0 ? Math.round((similarChecks / totalChecks) * 100) : 0;

  return {
    percent,
    method: "openrouter-rerank",
    details:
      similarChecks > 0
        ? `Модель ${PLAGIARISM_MODEL} нашла ${similarChecks} из ${totalChecks} фрагментов с высоким сходством.`
        : "Rerank-модель не обнаружила явных дубликатов в тексте.",
  };
}

export async function checkPlagiarism(content: string): Promise<PlagiarismResult> {
  if (!content.trim()) {
    throw new Error("Нет текста для проверки на плагиат.");
  }

  if (process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY) {
    try {
      return await checkPlagiarismOpenRouter(content);
    } catch {
      return checkPlagiarismLocal(content);
    }
  }

  return checkPlagiarismLocal(content);
}
