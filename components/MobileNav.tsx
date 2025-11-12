"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, UploadCloud } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { primaryNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-end gap-2 md:hidden">
      <Button asChild size="sm" className="gap-1 rounded-full bg-primary text-primary-foreground shadow-sm">
        <Link href="/upload">
          <UploadCloud className="h-4 w-4" />
          Upload
        </Link>
      </Button>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex h-full flex-col gap-6 bg-background/95 p-6">
          <SheetHeader className="gap-2 text-left">
            <SheetTitle className="text-2xl text-foreground">Browse Aomori Vision</SheetTitle>
            <SheetDescription>
              Quick navigation for mobile screens. Data uploads, dashboards, and guides stay a tap away.
            </SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-2">
            {primaryNavigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition hover:border-primary/60 hover:bg-primary/5",
                    isActive ? "border-primary/70 bg-primary/5" : "border-border/60 bg-card/70"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      {item.description ? (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      ) : null}
                    </div>
                  </div>
                  {isActive ? <Badge variant="outline">Active</Badge> : null}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-3 rounded-2xl border border-primary/40 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-primary">Need guidance?</p>
            <p className="text-xs text-muted-foreground">
              Review the upload guide to learn which columns are required for PDF/Excel imports and how to sync with
              the dashboard.
            </p>
            <Button asChild size="sm" variant="secondary" className="w-full">
              <Link href="/upload">Open upload guide</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
