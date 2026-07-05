export type ParsedArticle = {
  date: string | null;
  title: string;
  content: string;
};

export type PlagiarismResult = {
  percent: number;
  method: "copyleaks" | "local";
  details: string;
};

export type ImageResult = {
  url: string;
  alt: string;
};
