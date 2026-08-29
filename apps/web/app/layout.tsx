import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "BotSwan — AI Statistical Auditor for Charts",
  description:
    "Upload a chart. BotSwan extracts claims, runs statistical checks, and delivers a shareable audit.",
};

function SwanMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-7 w-7 text-accent"
      aria-hidden
      fill="currentColor"
    >
      <path d="M16 4c-2 0-4 1.5-5 3.5C10 5 8 4 6 5c-2 1-2.5 4-1 6 2 3 6 4 8 4s6-1 8-4c1.5-2 1-5-1-6-2-1-4 0-5 2.5C20 5.5 18 4 16 4zm0 8c-3 0-6 2-7 5 1-1 3-2 5-2h4c2 0 4 1 5 2-1-3-4-5-7-5z" />
    </svg>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans">
        <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="group flex items-center gap-2.5">
              <SwanMark />
              <span className="font-display text-xl tracking-tight text-white group-hover:text-accent transition-colors">
                BotSwan
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/history" className="hover:text-white transition-colors">
                History
              </Link>
              <a
                href="https://github.com"
                className="hidden sm:inline hover:text-white transition-colors"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-white/5 py-10 text-center text-sm text-slate-500">
          <p>The swan that audits your graphs.</p>
        </footer>
      </body>
    </html>
  );
}
