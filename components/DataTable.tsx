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
                  const content =
                    column.render !== undefined
                      ? column.render(row)
                      : (row as Record<string, unknown>)[column.key as string];

                  return (
                    <TableCell key={String(column.key)} className={column.className}>
                      {content === null || content === undefined || content === "" ? (
                        <span className="text-muted-foreground/70">—</span>
                      ) : typeof content === "number" ? (
                        content.toLocaleString()
                      ) : (
                        String(content)
                      )}
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
