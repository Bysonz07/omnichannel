import { SalesRecord, StockRecord } from "@/lib/types";

export const stockData: StockRecord[] = [
  {
    kode_produk: "1006-12F",
    nama_produk: "1006 12 INC FANTA",
    kategori: "SOFT12",
    satuan: "PCS",
    gudang: "51B",
    qty: 3
  },
  {
    kode_produk: "1006-12M",
    nama_produk: "1006 12 INC MERAH",
    kategori: "SOFT12",
    satuan: "PCS",
    gudang: "51B",
    qty: 2
  }
];

export const salesData: SalesRecord[] = [
  {
    tanggal: "2025-10-01",
    customer: "MW SHOPEE",
    faktur: "JL-050222",
    kode_produk: "BN02-12H",
    nama_barang: "BN02-12H",
    qty: 1,
    harga_satuan: 44900,
    jumlah: 44900,
    total: 44900
  },
  {
    tanggal: "2025-10-02",
    customer: "SHOPEE",
    faktur: "JL-050218",
    kode_produk: "BN02-13H",
    nama_barang: "BN02-13H",
    qty: 1,
    harga_satuan: 44900,
    jumlah: 44900,
    total: 44900
  }
];
