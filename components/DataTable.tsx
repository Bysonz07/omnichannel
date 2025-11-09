import type React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ColumnDefinition<T> = {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: ColumnDefinition<T>[];
  data: T[];
  emptyMessage?: string;
  caption?: string;
  dense?: boolean;
  onRowClick?: (row: T) => void;
};

export function DataTable<T>({
  columns,
  data,
  emptyMessage = "No data to display.",
  caption,
  dense,
  onRowClick
}: DataTableProps<T>) {
  return (
    <ScrollArea className="w-full">
      <Table className={cn(dense ? "text-xs" : "text-sm")}>
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.key)} className={cn("font-medium", column.className)}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={index}
                className={cn(onRowClick ? "cursor-pointer hover:bg-primary/5" : undefined)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => {
                  const renderer = column.render;
                  if (typeof renderer === "function") {
                    const content = renderer(row);
                    return (
                      <TableCell key={String(column.key)} className={column.className}>
                        {renderCustomContent(content)}
                      </TableCell>
                    );
                  }

                  const value = (row as Record<string, unknown>)[column.key as string];
                  return (
                    <TableCell key={String(column.key)} className={column.className}>
                      {renderPrimitiveContent(value)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

function renderCustomContent(content: React.ReactNode) {
  if (content === null || content === undefined) {
    return <span className="text-muted-foreground/70">-</span>;
  }
  return content;
}

function renderPrimitiveContent(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground/70">-</span>;
  }
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return String(value);
}
