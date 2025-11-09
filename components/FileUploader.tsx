/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Inbox, Loader2, UploadCloud } from "lucide-react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DocumentType } from "@/lib/types";

export type ParsedDataset = {
  fileName: string;
  size: number;
  columns: string[];
  rows: Record<string, any>[];
  documentType?: DocumentType;
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
  "text/plain",
  "application/pdf"
];

export function FileUploader({ title, description, accept, onParsed, helper }: FileUploaderProps) {
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastDataset, setLastDataset] = useState<ParsedDataset>();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const acceptedTypes = useMemo(() => accept ?? ".xlsx,.xls,.csv,.json,.pdf", [accept]);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) {
        return;
      }
      const file = fileList[0];
      setIsLoading(true);
      setError(undefined);
      setProgress(5);
      setLastDataset(undefined);
      try {
        if (
          !SUPPORTED_TYPES.some((type) => file.type.includes(type)) &&
          !acceptedTypes.includes(file.name.split(".").pop() ?? "")
        ) {
          throw new Error("Unsupported file type. Please upload CSV, Excel, JSON, or PDF.");
        }

        const extension = file.name.split(".").pop()?.toLowerCase();
        const isPdf = file.type === "application/pdf" || extension === "pdf";

        let rows: Record<string, any>[] = [];
        let documentType: DocumentType | undefined;

        if (isPdf) {
          const pdfResult = await convertPdfToJson(file, setProgress);
          rows = pdfResult.rows;
          documentType = pdfResult.documentType;
        } else {
          setProgress(35);
          rows = await parseStructuredFile(file);
          setProgress(85);
        }

        if (!rows.length) {
          throw new Error("File parsed successfully but no rows were detected.");
        }
        const columnSet = rows.reduce<Set<string>>((acc, row) => {
          Object.keys(row).forEach((key) => acc.add(key));
          return acc;
        }, new Set<string>());
        const columns = Array.from(columnSet);
        const dataset: ParsedDataset = {
          fileName: file.name,
          size: file.size,
          rows,
          columns,
          documentType
        };
        setLastDataset(dataset);
        onParsed(dataset);
        setProgress(100);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to parse this file.";
        setError(message);
        setProgress(0);
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
            <p className="text-xs text-muted-foreground">Supports Excel (.xlsx), CSV, JSON, and PDF reports.</p>
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
        {progress > 0 ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{isLoading && progress < 100 ? "Processing file..." : "Processing complete"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        ) : null}
        {lastDataset ? (
          <div className="mt-4 rounded-lg border border-border/60 bg-card/70 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{lastDataset.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(lastDataset.size)} · {lastDataset.rows.length} rows parsed
                  {lastDataset.documentType ? ` · ${lastDataset.documentType.toUpperCase()} dataset` : ""}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => downloadDataset(lastDataset)}>
                Download JSON
              </Button>
            </div>
          </div>
        ) : null}
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

async function convertPdfToJson(
  file: File,
  onProgress: (value: number) => void
): Promise<{ rows: Record<string, any>[]; documentType?: DocumentType }> {
  const formData = new FormData();
  formData.append("file", file);
  onProgress(30);
  const response = await fetch("/api/convert", {
    method: "POST",
    body: formData
  });
  onProgress(70);
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const message = payload?.message ?? "Unable to convert PDF file.";
    throw new Error(message);
  }
  onProgress(95);
  const rows = Array.isArray(payload?.rows)
    ? (payload.rows as Record<string, any>[])
    : [];
  return {
    rows,
    documentType: payload?.type as DocumentType | undefined
  };
}

function downloadDataset(dataset: ParsedDataset) {
  const blob = new Blob([JSON.stringify(dataset.rows, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const baseName =
    dataset.documentType ?? dataset.fileName.replace(/\.[^.]+$/, "") ?? "dataset";
  anchor.href = url;
  anchor.download = `${baseName}_data.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatBytes(size?: number) {
  if (typeof size !== "number" || Number.isNaN(size)) {
    return "-";
  }
  if (size === 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** exponent;
  const digits = exponent === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[exponent]}`;
}

async function parseStructuredFile(file: File): Promise<Record<string, any>[]> {
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
