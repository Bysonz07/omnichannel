import fs from "fs";
import path from "path";
import { addMonths, isSameMonth, parseISO } from "date-fns";
import { z } from "zod";

import { salesData as defaultSales, stockData as defaultStock } from "@/lib/mock-data";
import type { DashboardSummary, SalesRecord, StockRecord } from "@/lib/types";

const stockSchema = z.object({
  kode_produk: z.string(),
  nama_produk: z.string(),
  kategori: z.string(),
  satuan: z.string(),
  gudang: z.string(),
  qty: z.number()
});

const salesSchema = z.object({
  tanggal: z.string(),
  customer: z.string(),
  faktur: z.string(),
  kode_produk: z.string(),
  nama_barang: z.string(),
  qty: z.number(),
  harga_satuan: z.number(),
  jumlah: z.number(),
  total: z.number()
});

const DATA_DIR = path.join(process.cwd(), ".sv-data");
const STOCK_FILE = path.join(DATA_DIR, "stock.json");
const SALES_FILE = path.join(DATA_DIR, "sales.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(file: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile<T>(file: string, data: T) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

export function getStock(): StockRecord[] {
  return readJsonFile<StockRecord[]>(STOCK_FILE, structuredClone(defaultStock));
}

export function getSales(): SalesRecord[] {
  return readJsonFile<SalesRecord[]>(SALES_FILE, structuredClone(defaultSales));
}

export function setStock(data: StockRecord[]) {
  writeJsonFile(STOCK_FILE, data);
}

export function setSales(data: SalesRecord[]) {
  writeJsonFile(SALES_FILE, data);
}

export function validateStockPayload(payload: unknown) {
  return z.array(stockSchema).parse(payload);
}

export function validateSalesPayload(payload: unknown) {
  return z.array(salesSchema).parse(payload);
}

export function getDashboardSummary(): DashboardSummary {
  const stock = getStock();
  const sales = getSales();

  const stockByCode = new Map<string, StockRecord>();
  stock.forEach((record) => {
    const existing = stockByCode.get(record.kode_produk);
    if (existing) {
      stockByCode.set(record.kode_produk, {
        ...record,
        qty: existing.qty + Math.max(record.qty, 0)
      });
    } else {
      stockByCode.set(record.kode_produk, { ...record, qty: Math.max(record.qty, 0) });
    }
  });

  const salesByCode = new Map<string, SalesRecord[]>();
  sales.forEach((sale) => {
    const arr = salesByCode.get(sale.kode_produk) ?? [];
    arr.push(sale);
    salesByCode.set(sale.kode_produk, arr);
  });

  const linkedProducts = new Map<string, ReturnType<typeof buildLinkedRecord>>();

  function buildLinkedRecord(code: string) {
    const stockRecord =
      stockByCode.get(code) ??
      ({
        kode_produk: code,
        nama_produk: "",
        kategori: "UNASSIGNED",
        satuan: "-",
        gudang: "-",
        qty: 0
      } satisfies StockRecord);

    const salesTransactions = salesByCode.get(code) ?? [];
    const totalSales = salesTransactions.reduce((acc, item) => acc + Math.max(item.qty, 0), 0);
    const remaining = stockRecord.qty - totalSales;

    return {
      ...stockRecord,
      totalSales,
      remaining,
      transactions: salesTransactions
    };
  }

  const uniqueCodes = new Set<string>([...stockByCode.keys(), ...salesByCode.keys()]);
  uniqueCodes.forEach((code) => {
    linkedProducts.set(code, buildLinkedRecord(code));
  });

  const linkedArray = Array.from(linkedProducts.values());

  const totalStockQty = linkedArray.reduce((acc, product) => acc + Math.max(product.qty, 0), 0);

  const now = new Date();
  const salesThisMonth = linkedArray.flatMap((p) => p.transactions);
  const filteredMonthlySales = salesThisMonth.filter((sale) => {
    try {
      const saleDate = parseISO(sale.tanggal);
      return !Number.isNaN(saleDate.getTime()) && isSameMonth(saleDate, now);
    } catch {
      return false;
    }
  });

  const monthlySalesQty = filteredMonthlySales.reduce((acc, sale) => acc + sale.qty, 0);
  const monthlySalesValue = filteredMonthlySales.reduce((acc, sale) => acc + sale.total, 0);

  const bestSellers = [...linkedArray]
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);

  const lowStock = linkedArray
    .filter((product) => product.qty < 10 || product.remaining < 10)
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 10);

  const stockByCategory = aggregateBy(linkedArray, (product) => product.kategori || "UNKNOWN", (product) =>
    Math.max(product.qty, 0)
  );

  const warehouseDistribution = aggregateBy(
    linkedArray,
    (product) => product.gudang || "N/A",
    (product) => Math.max(product.qty, 0)
  );

  const startDate = filteredMonthlySales.length
    ? filteredMonthlySales
        .map((sale) => parseISO(sale.tanggal))
        .sort((a, b) => a.getTime() - b.getTime())[0]
    : addMonths(now, -3);

  const salesTrendMap = new Map<string, number>();
  sales.forEach((sale) => {
    const saleDate = parseISO(sale.tanggal);
    if (Number.isNaN(saleDate.getTime())) {
      return;
    }
    const key = saleDate.toISOString().split("T")[0];
    salesTrendMap.set(key, (salesTrendMap.get(key) ?? 0) + sale.total);
  });

  const salesTrend = Array.from(salesTrendMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([date, value]) => ({ date, value }));

  return {
    totals: {
      stockQty: totalStockQty,
      monthlySalesQty,
      monthlySalesValue
    },
    bestSellers,
    lowStock,
    stockByCategory,
    salesTrend,
    warehouseDistribution,
    products: linkedArray
  };
}

function aggregateBy<T>(
  items: T[],
  key: (item: T) => string,
  value: (item: T) => number
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const k = key(item);
    map.set(k, (map.get(k) ?? 0) + value(item));
  });
  return Array.from(map.entries())
    .map(([name, total]) => ({ name, value: total }))
    .sort((a, b) => b.value - a.value);
}
