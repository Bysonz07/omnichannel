import type { Metadata } from "next";
import "@/app/globals.css";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatAssistant } from "@/components/ChatAssistant";
import { MobileNav } from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Aomori Vision",
  description:
    "Aomori Vision blends sakura-inspired design with live stock & sales insights to keep your operations serene."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
  }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen">
          <AppSidebar />
          <div className="flex min-h-screen flex-1 flex-col bg-muted/20">
            <header className="border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-semibold tracking-tight text-accent md:text-3xl">Aomori Vision</h1>
                      <p className="text-sm text-muted-foreground sm:text-base">
                        Sakura-inspired clarity for every stock and sales decision.
                      </p>
                    </div>
                    <MobileNav />
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</div>
            </main>
            <footer className="border-t border-border bg-card/80 py-4 text-sm text-muted-foreground">
              <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 text-center sm:flex-row sm:justify-between sm:text-left">
                <span className="text-xs sm:text-sm">&copy; {new Date().getFullYear()} Aomori Vision</span>
                <span className="text-xs sm:text-sm">Crafted with Next.js, Tailwind CSS &amp; shadcn/ui</span>
              </div>
            </footer>
          </div>
        </div>
        <ChatAssistant />
      </body>
    </html>
  );
}
