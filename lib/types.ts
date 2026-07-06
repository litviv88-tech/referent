export type ParsedArticle = {
  date: string | null;
  title: string;
  content: string;
};

export type PlagiarismResult = {
  percent: number;
  method: "openrouter-rerank" | "local";
  details: string;
};

export type ImageResult = {
  url: string;
  alt: string;
};

export type SummaryResult = {
  text: string;
};

export type ThesesResult = {
  items: string[];
};

export type TelegramPostResult = {
  text: string;
};
