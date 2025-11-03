import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LinkedProduct } from "@/lib/types";
import { cn } from "@/lib/utils";

type SummaryDrawerProps = {
  product: LinkedProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SummaryDrawer({ product, open, onOpenChange }: SummaryDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-4 bg-background sm:max-w-lg">
        {product ? (
          <>
            <SheetHeader>
              <SheetTitle>{product.nama_produk || product.kode_produk}</SheetTitle>
              <SheetDescription>
                SKU <span className="font-semibold text-foreground">{product.kode_produk}</span> ·{" "}
                {product.kategori}
              </SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Stock on hand" value={product.qty} variant="primary" />
              <StatCard label="Total sales" value={product.totalSales} variant="secondary" />
              <StatCard
                label="Remaining"
                value={product.remaining}
                variant={product.remaining < 0 ? "danger" : "default"}
              />
              <StatCard label="Warehouse" value={product.gudang} variant="muted" />
            </div>
            {product.remaining < 0 ? (
              <Badge variant="default" className="bg-destructive text-destructive-foreground">
                Negative balance detected
              </Badge>
            ) : null}
            <ScrollArea className="flex-1 rounded-lg border border-border/70">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No sales yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    product.transactions.map((sale) => (
                      <TableRow key={sale.faktur}>
                        <TableCell>{sale.tanggal}</TableCell>
                        <TableCell className="max-w-[120px] truncate">{sale.customer}</TableCell>
                        <TableCell>{sale.qty}</TableCell>
                        <TableCell>IDR {sale.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <p>Select a product to see details.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  variant?: "default" | "primary" | "secondary" | "danger" | "muted";
};

function StatCard({ label, value, variant = "default" }: StatCardProps) {
  return (
    <Card className={cn("border-border/60 bg-card/90 text-sm", getVariantClass(variant))}>
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-xl font-semibold">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
      </CardContent>
    </Card>
  );
}

function getVariantClass(variant: StatCardProps["variant"]) {
  switch (variant) {
    case "primary":
      return "bg-primary/10 text-primary-foreground";
    case "secondary":
      return "bg-secondary/50";
    case "danger":
      return "bg-destructive/10 text-destructive";
    case "muted":
      return "bg-muted/50";
    default:
      return "";
  }
}
