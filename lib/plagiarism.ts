import { compareTwoStrings } from "string-similarity";
import {
  Copyleaks,
  CopyleaksFileSubmissionModel,
} from "plagiarism-checker";
import type { PlagiarismResult } from "./types";

const SIMILARITY_THRESHOLD = 0.85;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30);
}

function checkPlagiarismLocal(content: string): PlagiarismResult {
  const sentences = splitSentences(content);

  if (sentences.length < 2) {
    return {
      percent: 0,
      method: "local",
      details: "Недостаточно текста для локального анализа (string-similarity).",
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
        ? `Найдено ${similarPairs} пар похожих предложений (string-similarity).`
        : "Явных повторов и дубликатов предложений не обнаружено.",
  };
}

async function submitToCopyleaks(content: string): Promise<boolean> {
  const email = process.env.COPYLEAKS_EMAIL;
  const apiKey = process.env.COPYLEAKS_API_KEY;
  const webhookUrl = process.env.COPYLEAKS_WEBHOOK_URL;

  if (!email || !apiKey || !webhookUrl) {
    return false;
  }

  const copyleaks = new Copyleaks();
  const authToken = await copyleaks.loginAsync(email, apiKey);
  const scanId = crypto.randomUUID();
  const base64 = Buffer.from(content, "utf-8").toString("base64");

  const submission = new CopyleaksFileSubmissionModel(
    base64,
    "article.txt",
    {
      sandbox: true,
      webhooks: {
        status: `${webhookUrl}/webhook/{STATUS}`,
      },
    },
  );

  await copyleaks.submitFileAsync(authToken, scanId, submission);
  return true;
}

export async function checkPlagiarism(content: string): Promise<PlagiarismResult> {
  if (!content.trim()) {
    throw new Error("Нет текста для проверки на плагиат.");
  }

  const localResult = checkPlagiarismLocal(content);

  try {
    const submitted = await submitToCopyleaks(content);
    if (submitted) {
      return {
        ...localResult,
        method: "copyleaks",
        details: `${localResult.details} Текст также отправлен в Copyleaks (plagiarism-checker); результат придёт на webhook.`,
      };
    }
  } catch {
    // Локальный анализ остаётся основным результатом.
  }

  return localResult;
}
