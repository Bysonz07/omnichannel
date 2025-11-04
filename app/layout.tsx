import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";

import "@/app/globals.css";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";

const inter = localFont({
  src: "../public/fonts/Inter-roman.var.woff2",
  weight: "100 900",
  display: "swap"
});

export const metadata: Metadata = {
  title: "StockVision Pro",
  description:
    "Upload stock and sales data, visualize trends, and monitor low inventory with StockVision Pro."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <div className="flex min-h-screen">
          <AppSidebar />
          <div className="flex min-h-screen flex-1 flex-col bg-muted/20">
            <header className="border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-6">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">StockVision Pro</h1>
                  <p className="text-muted-foreground">
                    Transform raw stock &amp; sales files into actionable insights.
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
                <span>&copy; {new Date().getFullYear()} StockVision Pro</span>
                <span>Built with Next.js, Tailwind CSS &amp; shadcn/ui</span>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
