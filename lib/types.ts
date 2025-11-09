export type DocumentType = "sales" | "stock";

export type StockRecord = {
  kode_produk: string;
  nama_produk: string;
  kategori: string;
  satuan: string;
  gudang: string;
  qty: number;
};

export type SalesRecord = {
  tanggal: string; // ISO date string
  customer: string;
  faktur: string;
  kode_produk: string;
  nama_barang: string;
  qty: number;
  harga_satuan: number;
  jumlah: number;
  total: number;
};

export type PDFConversionResult =
  | {
      type: "sales";
      rows: SalesRecord[];
    }
  | {
      type: "stock";
      rows: StockRecord[];
    };

export type LinkedProduct = StockRecord & {
  totalSales: number;
  remaining: number;
  transactions: SalesRecord[];
};

export type DashboardSummary = {
  totals: {
    stockQty: number;
    monthlySalesQty: number;
    monthlySalesValue: number;
  };
  bestSellers: LinkedProduct[];
  lowStock: LinkedProduct[];
  stockByCategory: { name: string; value: number }[];
  salesTrend: { date: string; value: number }[];
  warehouseDistribution: { name: string; value: number }[];
  products: LinkedProduct[];
};
