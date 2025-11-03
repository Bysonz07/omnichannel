"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Overview",
    icon: Home
  },
  {
    href: "/upload",
    label: "Upload Data",
    icon: UploadCloud
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: BarChart3
  }
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-border/60 bg-card/70 pb-6 pt-8 md:flex md:w-64 md:flex-col">
      <div className="flex items-center gap-2 px-6 pb-8">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
          SV
        </span>
        <div>
          <p className="text-sm font-semibold tracking-tight text-muted-foreground">StockVision Pro</p>
          <span className="text-xs text-muted-foreground/70">Inventory intelligence</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Navigation</p>
        <div className="mt-2 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className={cn(
                  "justify-start gap-2 px-3 text-sm font-medium text-muted-foreground",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                )}
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </nav>
      <div className="mt-auto px-6 pt-6 text-xs text-muted-foreground/80">
        Need help? Visit the{" "}
        <Link href="/upload" className="font-medium text-primary hover:underline">
          upload guide
        </Link>
        .
      </div>
    </aside>
  );
}
