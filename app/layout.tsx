import type { Metadata } from "next";
import Link from "next/link";
import "@/app/globals.css";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatAssistant } from "@/components/ChatAssistant";
import { Button } from "@/components/ui/button";

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
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-6">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-accent">Aomori Vision</h1>
                  <p className="text-muted-foreground">
                    Sakura-inspired clarity for every stock and sales decision.
                  </p>
                </div>
                <div className="flex gap-2 md:hidden">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/">Home</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/upload">Upload</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-6xl px-6 py-10">{children}</div>
            </main>
            <footer className="border-t border-border bg-card/80 py-4 text-sm text-muted-foreground">
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
                <span>&copy; {new Date().getFullYear()} Aomori Vision</span>
                <span>Crafted with Next.js, Tailwind CSS &amp; shadcn/ui</span>
              </div>
            </footer>
          </div>
        </div>
        <ChatAssistant />
      </body>
    </html>
  );
}
