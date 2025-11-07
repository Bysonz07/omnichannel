import "server-only";

import fs from "fs";
import os from "os";
import path from "path";
import { isSameMonth, parse, parseISO } from "date-fns";
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

const DATA_DIR =
  process.env.SV_DATA_DIR ??
  (process.env.VERCEL ? path.join(os.tmpdir(), "sv-data") : path.join(process.cwd(), ".sv-data"));
const STOCK_FILE = path.join(DATA_DIR, "stock.json");
const SALES_FILE = path.join(DATA_DIR, "sales.json");

type MemoryStore = {
  stock: StockRecord[];
  sales: SalesRecord[];
};

let canUseDisk = true;
const memoryStore: MemoryStore = {
  stock: clone(defaultStock),
  sales: clone(defaultSales)
};

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function readJsonFile<K extends keyof MemoryStore>(key: K, file: string): MemoryStore[K] {
  if (canUseDisk && fs.existsSync(file)) {
    try {
      const raw = fs.readFileSync(file, "utf-8");
      const parsed = JSON.parse(raw) as MemoryStore[K];
      memoryStore[key] = parsed;
      return clone(parsed);
    } catch {
      canUseDisk = false;
    }
  }
  return clone(memoryStore[key]);
}

function writeJsonFile<K extends keyof MemoryStore>(key: K, file: string, data: MemoryStore[K]) {
  memoryStore[key] = clone(data);
  if (!canUseDisk) {
    return;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    canUseDisk = false;
  }
}

export function getStock(): StockRecord[] {
  return readJsonFile("stock", STOCK_FILE);
}

export function getSales(): SalesRecord[] {
  return readJsonFile("sales", SALES_FILE);
}

export function setStock(data: StockRecord[]) {
  writeJsonFile("stock", STOCK_FILE, data);
}

export function setSales(data: SalesRecord[]) {
  writeJsonFile("sales", SALES_FILE, data);
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
    const totalSales = salesTransactions.reduce((acc, item) => {
      const qty = toNumeric(item.qty) ?? 0;
      return acc + Math.max(qty, 0);
    }, 0);
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
    const saleDate = parseSaleDate(sale.tanggal);
    return saleDate ? isSameMonth(saleDate, now) : false;
  });

  const monthlySalesQty = filteredMonthlySales.reduce((acc, sale) => {
    const qty = toNumeric(sale.qty) ?? 0;
    return acc + Math.max(qty, 0);
  }, 0);
  const monthlySalesValue = filteredMonthlySales.reduce((acc, sale) => acc + getSaleValue(sale), 0);

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

  const salesTrendMap = new Map<string, number>();
  sales.forEach((sale) => {
    const saleDate = parseSaleDate(sale.tanggal);
    if (!saleDate) {
      return;
    }
    const saleValue = getSaleValue(sale);
    if (!Number.isFinite(saleValue)) {
      return;
    }
    const key = saleDate.toISOString().split("T")[0];
    salesTrendMap.set(key, (salesTrendMap.get(key) ?? 0) + saleValue);
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

function parseSaleDate(value: string) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && numeric > 0) {
    const excelDate = excelSerialToDate(numeric);
    if (excelDate) {
      return excelDate;
    }
  }

  try {
    const isoDate = parseISO(trimmed);
    if (!Number.isNaN(isoDate.getTime())) {
      return isoDate;
    }
  } catch {
    // ignore
  }

  const knownFormats = ["dd/MM/yyyy", "d/M/yyyy", "MM/dd/yyyy", "M/d/yyyy", "yyyy/MM/dd"];
  for (const format of knownFormats) {
    try {
      const parsedDate = parse(trimmed, format, new Date());
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    } catch {
      // ignore and try next format
    }
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function excelSerialToDate(serial: number) {
  if (!Number.isFinite(serial) || serial <= 0) {
    return null;
  }

  const excelEpoch = Date.UTC(1899, 11, 30);
  const wholeDays = Math.floor(serial);
  const fractionalDay = serial - wholeDays;
  const dayOffset = wholeDays > 59 ? wholeDays - 1 : wholeDays; // adjust for Excel leap year bug

  const millisecondsFromDays = dayOffset * 24 * 60 * 60 * 1000;
  const millisecondsFromFraction = Math.round(fractionalDay * 24 * 60 * 60 * 1000);

  return new Date(excelEpoch + millisecondsFromDays + millisecondsFromFraction);
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

function toNumeric(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const normalized = value.trim().replace(/[^0-9.-]+/g, "");
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getSaleValue(sale: SalesRecord) {
  const total = toNumeric(sale.total);
  if (total !== null) {
    return total;
  }

  const jumlah = toNumeric(sale.jumlah);
  if (jumlah !== null) {
    return jumlah;
  }

  const qty = toNumeric(sale.qty);
  const unitPrice = toNumeric(sale.harga_satuan);
  if (qty !== null && unitPrice !== null) {
    return qty * unitPrice;
  }

  return 0;
}
