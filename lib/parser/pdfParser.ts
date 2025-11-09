import { PDFParse } from "pdf-parse";

import type { DocumentType, PDFConversionResult, SalesRecord, StockRecord } from "@/lib/types";

type ParseOptions = {
  fileName?: string;
};

const SALES_KEYWORDS = ["penjualan", "tanggal", "customer", "faktur", "kode produk"];
const STOCK_KEYWORDS = ["daftar saldo stock", "gudang", "qty", "kategori"];

const SALES_HEADER_REGEX =
  /tanggal.+customer.+faktur.+kode.+(produk|barang).+qty.+(harga|jumlah|total)/i;
const STOCK_HEADER_REGEX = /kode.+nama.+kategori.+satuan.+gudang.+qty/i;
const DATE_REGEX = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{2}[\/\-]\d{2})/;

export async function parsePDF(
  buffer: Buffer,
  options?: ParseOptions
): Promise<PDFConversionResult | null> {
  const parser = new PDFParse({ data: buffer });
  let text = "";

  try {
    const textResult = await parser.getText();
    text = textResult?.text ?? "";
  } finally {
    await parser.destroy();
  }

  const detectedType = detectDocumentType(text);

  if (!detectedType) {
    console.warn("pdfParser", "Unable to detect document type for uploaded PDF.");
    return null;
  }

  const label = options?.fileName ?? "PDF buffer";

  if (detectedType === "sales") {
    const rows = parseSalesPDF(text);
    console.info(`✅ Parsed ${rows.length} sales rows from ${label}`);
    return {
      type: "sales",
      rows
    };
  }

  const rows = parseStockPDF(text);
  console.info(`✅ Parsed ${rows.length} stock rows from ${label}`);
  return {
    type: "stock",
    rows
  };
}

export function detectDocumentType(text: string): DocumentType | null {
  const snippet = text.toLowerCase().slice(0, 15000);
  const salesHits = SALES_KEYWORDS.reduce(
    (hits, keyword) => hits + (snippet.includes(keyword) ? 1 : 0),
    0
  );
  const stockHits = STOCK_KEYWORDS.reduce(
    (hits, keyword) => hits + (snippet.includes(keyword) ? 1 : 0),
    0
  );

  if (salesHits === 0 && stockHits === 0) {
    return null;
  }
  if (salesHits === stockHits) {
    if (snippet.includes("daftar saldo stock")) {
      return "stock";
    }
    if (snippet.includes("penjualan")) {
      return "sales";
    }
    return null;
  }
  return salesHits > stockHits ? "sales" : "stock";
}

export function parseSalesPDF(text: string): SalesRecord[] {
  const rows: SalesRecord[] = [];
  const lines = sanitizeLines(text);

  const headerIndex = lines.findIndex((line) => SALES_HEADER_REGEX.test(line));
  const dataLines = lines.slice(headerIndex >= 0 ? headerIndex + 1 : 0);

  for (const rawLine of dataLines) {
    if (!rawLine || rawLine.length < 5) {
      continue;
    }
    if (/^\s*(total|subtotal|grand total)/i.test(rawLine) || isFooterLine(rawLine)) {
      continue;
    }
    if (!DATE_REGEX.test(rawLine)) {
      continue;
    }

    const columns = splitColumns(rawLine);
    if (columns.length < 7) {
      continue;
    }

    const numericTail = columns.splice(-4);
    if (numericTail.length < 4) {
      continue;
    }

    const tanggalRaw = columns.shift();
    const customer = columns.shift();
    const faktur = columns.shift();
    const kodeProduk = columns.shift();
    const namaBarang = columns.join(" ").trim();

    if (!tanggalRaw || !kodeProduk) {
      continue;
    }

    rows.push({
      tanggal: normalizeDate(tanggalRaw),
      customer: (customer ?? "Unknown").trim() || "Unknown",
      faktur: faktur ? faktur.trim() : generateFallbackId("pdf-sale", rows.length),
      kode_produk: kodeProduk.trim(),
      nama_barang: namaBarang || kodeProduk.trim(),
      qty: parseInteger(numericTail[0]),
      harga_satuan: parseNumeric(numericTail[1]),
      jumlah: parseNumeric(numericTail[2]),
      total: parseNumeric(numericTail[3])
    });
  }

  return rows;
}

export function parseStockPDF(text: string): StockRecord[] {
  const rows: StockRecord[] = [];
  const lines = sanitizeLines(text);
  const headerIndex = lines.findIndex((line) => STOCK_HEADER_REGEX.test(line));
  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;

  for (const rawLine of lines.slice(startIndex)) {
    if (!rawLine || rawLine.length < 4) {
      continue;
    }
    if (isFooterLine(rawLine) || /^\s*(total|grand total)/i.test(rawLine)) {
      continue;
    }

    const columns = splitColumns(rawLine);
    if (columns.length < 4) {
      continue;
    }

    const qtyField = columns.pop();
    const gudang = columns.pop();
    const satuan = columns.pop();
    const kategori = columns.pop();
    const kodeProduk = columns.shift();
    const namaCandidate = columns.join(" ").trim();
    const namaProduk = namaCandidate || (kodeProduk?.trim() ?? "");

    if (!kodeProduk) {
      continue;
    }

    rows.push({
      kode_produk: kodeProduk.trim(),
      nama_produk: namaProduk,
      kategori: (kategori ?? "UNASSIGNED").trim() || "UNASSIGNED",
      satuan: (satuan ?? "-").trim() || "-",
      gudang: (gudang ?? "-").trim() || "-",
      qty: parseInteger(qtyField)
    });
  }

  return rows;
}

function sanitizeLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/\u00a0/g, " ")
        .replace(/\t/g, "    ")
        .replace(/[•▪·]/g, "")
        .trim()
    )
    .filter(Boolean);
}

function splitColumns(line: string): string[] {
  const normalized = line.includes("|") ? line.split("|") : line.split(/\s{2,}/);
  return normalized.map((column) => column.trim()).filter(Boolean);
}

function parseNumeric(input?: string | number | null): number {
  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }
  if (!input) {
    return 0;
  }
  const normalized = input
    .toString()
    .replace(/[^\d,.-]+/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseInteger(input?: string | number | null): number {
  const value = parseNumeric(input);
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}

function normalizeDate(input?: string | null): string {
  if (!input) {
    return new Date().toISOString().slice(0, 10);
  }
  const trimmed = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parts = trimmed.replace(/[^\d/.-]/g, "").split(/[\/.-]/).filter(Boolean);
  if (parts.length >= 3) {
    let [day, month, year] = parts;
    if (year.length === 2) {
      year = Number(year) > 50 ? `19${year}` : `20${year}`;
    }
    const iso = new Date(Number(year), Number(month) - 1, Number(day));
    if (!Number.isNaN(iso.getTime())) {
      return iso.toISOString().slice(0, 10);
    }
  }
  const fallback = new Date(trimmed);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

function isFooterLine(line: string) {
  return /(halaman|page\s+\d+|tanggal cetak|printed on)/i.test(line);
}

function generateFallbackId(prefix: string, index: number) {
  return `${prefix}-${Date.now()}-${index}`;
}
