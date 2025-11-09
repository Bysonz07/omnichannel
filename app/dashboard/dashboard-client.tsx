"use client";

import { Fragment, useMemo, useState } from "react";
import type { ReactElement } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import { KPIcard } from "@/components/KPIcard";
import { SummaryDrawer } from "@/components/SummaryDrawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary, LinkedProduct } from "@/lib/types";
import { cn } from "@/lib/utils";

type DashboardClientProps = {
  summary: DashboardSummary;
};

const palette = [
  "#2563eb",
  "#9333ea",
  "#f97316",
  "#0ea5e9",
  "#10b981",
  "#facc15",
  "#ef4444",
  "#14b8a6"
];

type SalesChartType = "line" | "bar" | "pie" | "histogram";
const salesChartOptions: { value: SalesChartType; label: string }[] = [
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "pie", label: "Pie" },
  { value: "histogram", label: "Hist" }
];

export function DashboardClient({ summary }: DashboardClientProps) {
  const [selectedProduct, setSelectedProduct] = useState<LinkedProduct | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [salesChartType, setSalesChartType] = useState<SalesChartType>("line");

  const productColumns = useMemo(
    () => [
      {
        key: "kode_produk",
        header: "Kode Produk"
      },
      {
        key: "nama_produk",
        header: "Nama Produk"
      },
      {
        key: "kategori",
        header: "Kategori"
      },
      {
        key: "qty",
        header: "Stock",
        render: (row: LinkedProduct) => row.qty.toLocaleString()
      },
      {
        key: "totalSales",
        header: "Sales",
        render: (row: LinkedProduct) => row.totalSales.toLocaleString()
      },
      {
        key: "remaining",
        header: "Remaining",
        render: (row: LinkedProduct) => {
          const remaining = ensureNumber(row.remaining);
          return (
            <span className={cn(remaining < 0 ? "font-semibold text-destructive" : "")}>
              {remaining.toLocaleString()}
            </span>
          );
        }
      }
    ],
    []
  );

  const bestSellerList = summary.bestSellers.slice(0, 5);
  const lowStockList = summary.lowStock.slice(0, 5);
  const sanitizedSalesTrend = useMemo(
    () => summary.salesTrend.filter((item) => Number.isFinite(item.value)),
    [summary.salesTrend]
  );
  const hasSalesTrendData = sanitizedSalesTrend.length > 0;

  const recentSalesTrend = useMemo(
    () => sanitizedSalesTrend.slice(Math.max(sanitizedSalesTrend.length - 30, 0)),
    [sanitizedSalesTrend]
  );

  const pieSalesTrend = useMemo(
    () =>
      recentSalesTrend.slice(-8).map((item) => ({
        ...item,
        name: formatDateLabel(item.date)
      })),
    [recentSalesTrend]
  );

  const salesHistogramData = useMemo(
    () => buildSalesHistogram(sanitizedSalesTrend),
    [sanitizedSalesTrend]
  );

  const salesChartContent = useMemo<ReactElement>(() => {
    if (!hasSalesTrendData) {
      return <Fragment />;
    }

    switch (salesChartType) {
      case "bar":
        return (
          <BarChart data={recentSalesTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatDateLabel(value)}
            />
            <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(value) => formatDateLabel(value)}
            />
            <Bar dataKey="value" fill={palette[0]} radius={[6, 6, 0, 0]} />
          </BarChart>
        );
      case "pie":
        return (
          <PieChart>
            <Pie
              data={pieSalesTrend}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {pieSalesTrend.map((item, index) => (
                <Cell key={item.name + index} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        );
      case "histogram":
        return (
          <BarChart data={salesHistogramData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip formatter={(value: number) => `${value} day${value === 1 ? "" : "s"}`} />
            <Bar dataKey="value" fill={palette[1]} radius={[6, 6, 0, 0]} />
          </BarChart>
        );
      case "line":
      default:
        return (
          <LineChart data={recentSalesTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatDateLabel(value)}
            />
            <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(value) => formatDateLabel(value)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke={palette[0]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        );
    }
  }, [hasSalesTrendData, pieSalesTrend, recentSalesTrend, salesChartType, salesHistogramData]);

  return (
    <div className="space-y-8">
      <SummaryDrawer
        product={selectedProduct}
        open={drawerOpen}
        onOpenChange={(open) => setDrawerOpen(open)}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPIcard
          title="Total stock quantity"
          value={summary.totals.stockQty.toLocaleString()}
          helper="Aggregated across all warehouses."
        />
        <KPIcard
          title="Sales quantity (month)"
          value={summary.totals.monthlySalesQty.toLocaleString()}
          helper="Captured stock minus units sold this month."
          trend={summary.totals.monthlySalesQty > 0 ? "up" : "neutral"}
        />
        <KPIcard
          title="Sales value (month)"
          value={`IDR ${summary.totals.monthlySalesValue.toLocaleString()}`}
          helper="Sum of the sales dataset's total column."
          trend={summary.totals.monthlySalesValue > 0 ? "up" : "neutral"}
        />
        <KPIcard
          title="Low stock items"
          value={summary.lowStock.length.toString()}
          helper="Items below the 10 unit threshold."
          trend={summary.lowStock.length > 0 ? "down" : "neutral"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Stock by category"
          description="Inventory spread across product categories."
          className="lg:col-span-1"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.stockByCategory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {summary.stockByCategory.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Sales trend"
          description="Daily sales value based on posted transactions."
          className="lg:col-span-1"
          action={
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="whitespace-nowrap">View as</span>
              <div className="inline-flex rounded-md border border-border/60 bg-muted/30 p-0.5">
                {salesChartOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSalesChartType(option.value)}
                    className={cn(
                      "rounded-sm px-2.5 py-1 text-xs font-semibold transition-colors",
                      salesChartType === option.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-pressed={salesChartType === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          {hasSalesTrendData ? (
            <ResponsiveContainer width="100%" height="100%">
              {salesChartContent}
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No sales data available.
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Warehouse distribution"
          description="Inventory allocation per warehouse."
          className="lg:col-span-1"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={summary.warehouseDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {summary.warehouseDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => value.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/70 bg-card/90 lg:col-span-1">
          <CardHeader>
            <CardTitle>Best sellers</CardTitle>
            <CardDescription>Top products by total sold units.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bestSellerList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales data available.</p>
            ) : (
              bestSellerList.map((product) => (
                <div
                  key={product.kode_produk}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{product.nama_produk || product.kode_produk}</p>
                    <p className="text-xs text-muted-foreground">{product.kode_produk}</p>
                  </div>
                  <Badge variant="secondary">{product.totalSales.toLocaleString()} sold</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 lg:col-span-1">
          <CardHeader>
            <CardTitle>Low stock alerts</CardTitle>
            <CardDescription>Items under the 10 unit buffer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockList.length === 0 ? (
              <p className="text-sm text-muted-foreground">All good! No low stock warnings.</p>
            ) : (
              lowStockList.map((product) => (
                <div
                  key={product.kode_produk}
                  className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {product.nama_produk || product.kode_produk}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {`Remaining ${ensureNumber(product.remaining).toLocaleString()} units`}
                    </p>
                  </div>
                  <Badge variant="default" className="bg-destructive text-destructive-foreground">
                    Low
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 lg:col-span-1">
          <CardHeader>
            <CardTitle>Dataset snapshot</CardTitle>
            <CardDescription>Overview of linked stock & sales data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Total products tracked: {summary.products.length.toLocaleString()}</p>
            <p>Warehouses: {summary.warehouseDistribution.length}</p>
            <p>Categories: {summary.stockByCategory.length}</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold">Linked inventory ledger</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Click on a product to open the detailed drawer with transaction history and remaining balance
            insights.
          </p>
        </div>
        <DataTable
          columns={productColumns}
          data={summary.products}
          caption="Complete snapshot of stock & sales data."
          onRowClick={(row) => {
            setSelectedProduct(row);
            setDrawerOpen(true);
          }}
        />
      </section>
    </div>
  );
}

function formatCurrency(value: number) {
  return `IDR ${value.toLocaleString()}`;
}

function ensureNumber(value: number | string | null | undefined, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function formatDateLabel(value: string | number) {
  if (typeof value === "string") {
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const localDate = new Date(Number(year), Number(month) - 1, Number(day));
      return localDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : value.toString();
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function buildSalesHistogram(data: { value: number }[]) {
  const values = data.map((item) => item.value).filter((amount) => Number.isFinite(amount));

  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [
      {
        name: formatCurrency(min),
        value: values.length
      }
    ];
  }

  const binCount = Math.min(7, Math.max(3, Math.round(Math.sqrt(values.length))));
  const binSize = (max - min) / binCount;

  const bins = Array.from({ length: binCount }, (_, index) => {
    const start = min + index * binSize;
    const end = index === binCount - 1 ? max : min + (index + 1) * binSize;
    return { start, end, value: 0 };
  });

  values.forEach((amount) => {
    const index = amount === max ? binCount - 1 : Math.floor((amount - min) / binSize);
    const clampedIndex = Math.min(Math.max(index, 0), binCount - 1);
    bins[clampedIndex].value += 1;
  });

  return bins.map((bin, index) => ({
    name:
      binCount === 1
        ? formatCurrency(bin.start)
        : index === bins.length - 1
        ? `${formatCurrency(bin.start)}+`
        : `${formatCurrency(bin.start)} - ${formatCurrency(bin.end)}`,
    value: bin.value
  }));
}
