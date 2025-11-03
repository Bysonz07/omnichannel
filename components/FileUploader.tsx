/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Inbox, Loader2, UploadCloud } from "lucide-react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ParsedDataset = {
  fileName: string;
  size: number;
  columns: string[];
  rows: Record<string, any>[];
};

type FileUploaderProps = {
  title: string;
  description?: string;
  accept?: string;
  onParsed: (payload: ParsedDataset) => void;
  helper?: string;
};

const SUPPORTED_TYPES = [
  "application/json",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain"
];

export function FileUploader({ title, description, accept, onParsed, helper }: FileUploaderProps) {
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const acceptedTypes = useMemo(() => accept ?? ".xlsx,.xls,.csv,.json", [accept]);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) {
        return;
      }
      const file = fileList[0];
      setIsLoading(true);
      setError(undefined);
      try {
        if (![...SUPPORTED_TYPES].some((type) => file.type.includes(type)) && !acceptedTypes.includes(file.name.split(".").pop() ?? "")) {
          throw new Error("Unsupported file type. Please upload CSV, Excel, or JSON.");
        }
        const rows = await parseFile(file);
        if (!rows.length) {
          throw new Error("File parsed successfully but no rows were detected.");
        }
        const columnSet = rows.reduce<Set<string>>((acc, row) => {
          Object.keys(row).forEach((key) => acc.add(key));
          return acc;
        }, new Set<string>());
        const columns = Array.from(columnSet);
        onParsed({
          fileName: file.name,
          size: file.size,
          rows,
          columns
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to parse this file.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [acceptedTypes, onParsed]
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      void handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  }, []);

  const triggerSelect = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <Card className={cn("border-dashed border-border/80 bg-card/80", dragActive ? "border-primary shadow-lg" : "")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <UploadCloud className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/70 bg-muted/30 p-8 transition-colors",
            dragActive && "border-primary bg-primary/5"
          )}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          role="presentation"
        >
          {isLoading ? (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          ) : (
            <Inbox className="h-12 w-12 text-primary/70" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium">
              Drag &amp; drop your file here or{" "}
              <Button variant="link" className="px-1" onClick={triggerSelect}>
                browse
              </Button>
            </p>
            <p className="text-xs text-muted-foreground">Supports Excel (.xlsx), CSV, and JSON files.</p>
            {helper ? <p className="mt-2 text-xs text-muted-foreground">{helper}</p> : null}
          </div>
          <Input
            ref={inputRef}
            type="file"
            accept={acceptedTypes}
            className="hidden"
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

async function parseFile(file: File): Promise<Record<string, any>[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "json") {
    const text = await file.text();
    const json = JSON.parse(text);
    if (Array.isArray(json)) {
      return json.map((row) => normalizeRow(row));
    }
    if (Array.isArray(json.records)) {
      return json.records.map((row: unknown) => normalizeRow(row));
    }
    throw new Error("JSON format not recognized. Expected an array of records.");
  }

  if (extension === "csv") {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: "string" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
    return rows.map((row) => normalizeRow(row));
  }

  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
  return rows.map((row) => normalizeRow(row));
}

function normalizeRow(row: unknown): Record<string, any> {
  if (row && typeof row === "object") {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [sanitizeKey(key), value ?? ""])
    );
  }
  return {};
}

function sanitizeKey(key: string) {
  return key
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "")
    .toLowerCase();
}
