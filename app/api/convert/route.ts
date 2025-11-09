import { NextResponse } from "next/server";

import { parsePDF } from "@/lib/parser/pdfParser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "A file payload is required." }, { status: 400 });
    }

    const mimeType = file.type || "";
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (mimeType === "application/pdf" || extension === "pdf") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parsePDF(buffer, { fileName: file.name });
      if (!parsed) {
        return NextResponse.json(
          { message: "Unable to detect PDF document type. Please verify the template." },
          { status: 422 }
        );
      }

      return NextResponse.json({
        ...parsed,
        count: parsed.rows.length,
        fileName: file.name
      });
    }

    return NextResponse.json(
      { message: "Unsupported file type. Only PDF conversion is available on this endpoint." },
      { status: 415 }
    );
  } catch (error) {
    console.error("[api/convert] Failed to convert file", error);
    return NextResponse.json({ message: "Conversion failed. Please try again." }, { status: 500 });
  }
}
