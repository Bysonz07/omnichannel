"use client";

import { useMemo, useState } from "react";
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

export function DashboardClient({ summary }: DashboardClientProps) {
  const [selectedProduct, setSelectedProduct] = useState<LinkedProduct | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        render: (row: LinkedProduct) => (
          <span className={cn(row.remaining < 0 ? "font-semibold text-destructive" : "")}>
            {row.remaining.toLocaleString()}
          </span>
        )
      }
    ],
    []
  );

  const bestSellerList = summary.bestSellers.slice(0, 5);
  const lowStockList = summary.lowStock.slice(0, 5);

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
          helper="Sum of all sold units this calendar month."
          trend={summary.totals.monthlySalesQty > 0 ? "up" : "neutral"}
        />
        <KPIcard
          title="Sales value (month)"
          value={`IDR ${summary.totals.monthlySalesValue.toLocaleString()}`}
          helper="Gross sales value this month."
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
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={palette[0]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
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
                      Remaining {product.remaining.toLocaleString()} units
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
