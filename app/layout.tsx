import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Referent",
  description: "Парсинг англоязычных статей",
};

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('referent-theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="newspaper-bg antialiased text-[var(--fg)]">
        {children}
      </body>
    </html>
  );
}
