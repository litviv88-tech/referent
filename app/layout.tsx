import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Referent",
  description: "Парсинг англоязычных статей",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
