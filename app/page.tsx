import Link from "next/link";
import { ArrowRight, Upload, BarChart3, Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    icon: Upload,
    title: "Flexible import",
    description: "Drag & drop Excel, CSV, or JSON stock files and preview the parsed output instantly."
  },
  {
    icon: Database,
    title: "Smart data linking",
    description: "Automatically connect stock and sales entries by kode_produk and compute live balances."
  },
  {
    icon: BarChart3,
    title: "Actionable analytics",
    description: "Monitor KPIs, sales trends, and low-stock alerts tailored to your warehouse footprint."
  }
];

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <section className="rounded-3xl border border-border bg-card/80 p-10 shadow-lg">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-4">
            <h2 className="text-4xl font-semibold tracking-tight">
              Gain the full story behind your stock—without leaving the spreadsheet.
            </h2>
            <p className="text-lg text-muted-foreground">
              StockVision Pro ingests your stock counts and sales orders, then delivers live summaries,
              trend visualizations, and proactive low-stock alerts so you can act before it is too late.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/upload">
                  Start Uploading
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
            </div>
          </div>
          <div className="grid w-full gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:max-w-xs">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-primary">Live preview</p>
              <h3 className="text-2xl font-semibold">Stock insights in minutes</h3>
            </div>
            <Separator />
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Boxed dashboard metrics with alert badges</li>
              <li>• Linked stock ⇄ sales ledger</li>
              <li>• Export-ready JSON output</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="h-full border-border/60 bg-card/90 backdrop-blur">
            <CardHeader className="space-y-2">
              <feature.icon className="h-8 w-8 text-primary" />
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" className="px-0 text-sm text-primary">
                <Link href="/dashboard">
                  Explore insights <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
