"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, CloudUpload } from "lucide-react";

import { DataTable } from "@/components/DataTable";
import { FileUploader, type ParsedDataset } from "@/components/FileUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { SalesRecord, StockRecord } from "@/lib/types";

type UploadState<T> = {
  dataset: ParsedDataset;
  normalized: T[];
};

export default function UploadPage() {
  const [stockState, setStockState] = useState<UploadState<StockRecord>>();
  const [salesState, setSalesState] = useState<UploadState<SalesRecord>>();
  const [status, setStatus] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const stockColumns = useMemo(
    () => [
      { key: "kode_produk", header: "Kode Produk" },
      { key: "nama_produk", header: "Nama Produk" },
      { key: "kategori", header: "Kategori" },
      { key: "gudang", header: "Gudang" },
      { key: "qty", header: "Qty" }
    ],
    []
  );

  const salesColumns = useMemo(
    () => [
      { key: "tanggal", header: "Tanggal" },
      { key: "customer", header: "Customer" },
      { key: "faktur", header: "Faktur" },
      { key: "kode_produk", header: "Kode Produk" },
      { key: "qty", header: "Qty" },
      { key: "total", header: "Total (IDR)" }
    ],
    []
  );

  async function handleSync(endpoint: "stock" | "sales") {
    startTransition(async () => {
      try {
        setStatus(undefined);
        const payload =
          endpoint === "stock" ? stockState?.normalized ?? [] : salesState?.normalized ?? [];
        if (payload.length === 0) {
          setStatus("Please upload and parse a dataset first.");
          return;
        }
        const res = await fetch(`/api/upload/${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const message = await res.json();
          throw new Error(message?.message ?? "Sync failed");
        }
        const message = endpoint === "stock" ? "Stock dataset synced." : "Sales dataset synced.";
        setStatus(message);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        setStatus(message);
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2">
        <FileUploader
          title="Upload Stock File"
          description="Drag and drop your stock ledger export. We automatically map key columns."
          helper="Expected columns: kode_produk, nama_produk, kategori, satuan, gudang, qty."
          onParsed={(dataset) => {
            const normalized = normalizeStock(dataset.rows);
            setStockState({ dataset, normalized });
            setStatus("Stock file parsed. Ready to sync.");
          }}
        />
        <FileUploader
          title="Upload Sales File"
          description="Support for Shopee/Tokopedia CSV, Excel downloads, and JSON exports."
          helper="Expected columns: tanggal, customer, faktur, kode_produk, qty, harga_satuan, total."
          onParsed={(dataset) => {
            const normalized = normalizeSales(dataset.rows);
            setSalesState({ dataset, normalized });
            setStatus("Sales file parsed. Ready to sync.");
          }}
        />
      </section>

      {status ? (
        <Badge variant="secondary" className="flex w-fit items-center gap-2 border border-primary/40 bg-primary/10 text-primary">
          <Check className="h-4 w-4" />
          {status}
        </Badge>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 bg-card/90">
          <CardHeader>
            <CardTitle>Stock preview</CardTitle>
            <CardDescription>
              {stockState
                ? `${stockState.normalized.length} records parsed from ${stockState.dataset.fileName}.`
                : "Upload a stock file to see the parsed preview."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {stockState ? `Columns detected: ${stockState.dataset.columns.join(", ")}` : ""}
              </span>
              <Button
                variant="default"
                size="sm"
                disabled={!stockState || isPending}
                onClick={() => handleSync("stock")}
              >
                <CloudUpload className="mr-2 h-4 w-4" />
                Sync stock
              </Button>
            </div>
            <Separator />
            <DataTable
              columns={stockColumns}
              data={stockState ? stockState.normalized.slice(0, 20) : []}
              caption={stockState ? "Showing first 20 rows." : undefined}
            />
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/90">
          <CardHeader>
            <CardTitle>Sales preview</CardTitle>
            <CardDescription>
              {salesState
                ? `${salesState.normalized.length} records parsed from ${salesState.dataset.fileName}.`
                : "Upload a sales file to see the parsed preview."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {salesState ? `Columns detected: ${salesState.dataset.columns.join(", ")}` : ""}
              </span>
              <Button
                variant="default"
                size="sm"
                disabled={!salesState || isPending}
                onClick={() => handleSync("sales")}
              >
                <CloudUpload className="mr-2 h-4 w-4" />
                Sync sales
              </Button>
            </div>
            <Separator />
            <DataTable
              columns={salesColumns}
              data={salesState ? salesState.normalized.slice(0, 20) : []}
              caption={salesState ? "Showing first 20 rows." : undefined}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function normalizeStock(rows: Record<string, unknown>[]): StockRecord[] {
  return rows
    .map((row) => {
      const kode = findByAliases(row, ["kode_produk", "sku", "product_code", "kode"]);
      if (!kode) {
        return null;
      }
      const nama = findByAliases(row, ["nama_produk", "nama_barang", "product_name", "nama"]);
      const kategori = findByAliases(row, ["kategori", "category"]);
      const satuan = findByAliases(row, ["satuan", "unit"]);
      const gudang = findByAliases(row, ["gudang", "warehouse"]);
      const qty = findByAliases(row, ["qty", "jumlah", "quantity", "stock", "saldo"]);
      const parsedQty = coerceNumber(qty);
      return {
        kode_produk: String(kode),
        nama_produk: String(nama ?? kode),
        kategori: String(kategori ?? "UNASSIGNED"),
        satuan: String(satuan ?? "-"),
        gudang: String(gudang ?? "-"),
        qty: parsedQty ?? 100
      };
    })
    .filter((record): record is StockRecord => Boolean(record));
}

function normalizeSales(rows: Record<string, unknown>[]): SalesRecord[] {
  return rows
    .map((row) => {
      const kode = findByAliases(row, ["kode_produk", "sku", "product_code", "kode"]);
      if (!kode) {
        return null;
      }
      const tanggal = findByAliases(row, ["tanggal", "date", "order_date"]);
      const customer = findByAliases(row, ["customer", "buyer"]);
      const faktur = findByAliases(row, ["faktur", "invoice", "order_id"]);
      const nama = findByAliases(row, ["nama_barang", "nama_produk", "product_name", "nama"]);
      const qty = findByAliases(row, ["qty", "quantity", "jumlah"]);
      const hargaSatuan = findByAliases(row, ["harga_satuan", "unit_price", "price"]);
      const jumlah = findByAliases(row, ["jumlah", "subtotal", "line_total"]);
      const total = findByAliases(row, ["total", "total_amount", "grand_total"]);

      const fakturId =
        faktur && typeof faktur === "string" && faktur.length > 0
          ? faktur
          : typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `sale-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

      return {
        tanggal: String(tanggal ?? new Date().toISOString().slice(0, 10)),
        customer: String(customer ?? "Unknown"),
        faktur: String(fakturId),
        kode_produk: String(kode),
        nama_barang: String(nama ?? kode),
        qty: coerceNumber(qty) ?? 0,
        harga_satuan: coerceNumber(hargaSatuan) ?? 0,
        jumlah: coerceNumber(jumlah) ?? 0,
        total: coerceNumber(total) ?? 0
      };
    })
    .filter((record): record is SalesRecord => Boolean(record));
}

function findByAliases(source: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    if (alias in source) {
      return source[alias];
    }
    const direct = source[alias.replace(/_/g, "")];
    if (direct !== undefined) {
      return direct;
    }
  }
  return undefined;
}

function coerceNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]+/g, "");
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
