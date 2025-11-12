import { NextResponse } from "next/server";

import { getSales, getStock } from "@/lib/data-store";

export const runtime = "nodejs";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

type ChatHistory = {
  role: "user" | "assistant";
  content: string;
}[];

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "Missing GEMINI_API_KEY environment variable." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as { message?: string; history?: ChatHistory };
    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ message: "Prompt is required." }, { status: 400 });
    }

    const [stock, sales] = await Promise.all([getStock(), getSales()]);

    const prompt = buildPrompt({
      question: message,
      history: body.history ?? [],
      stock,
      sales
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      console.error("Gemini API error", errorPayload);
      return NextResponse.json(
        { message: "Gemini API request failed.", details: errorPayload },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text =
      data.candidates
        ?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.text?.trim())
        .filter(Boolean)
        .join("\n\n")?.trim() ?? "I could not generate a response right now.";

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Chat route error", error);
    return NextResponse.json({ message: "Unexpected server error." }, { status: 500 });
  }
}

function buildPrompt({
  question,
  history,
  stock,
  sales
}: {
  question: string;
  history: ChatHistory;
  stock: Awaited<ReturnType<typeof getStock>>;
  sales: Awaited<ReturnType<typeof getSales>>;
}) {
  const stockContext = stock
    .slice(0, 50)
    .map(
      (record) =>
        `${record.kode_produk} (${record.nama_produk}) | qty ${record.qty} | gudang ${record.gudang} | kategori ${record.kategori}`
    )
    .join("\n");

  const salesContext = sales
    .slice(0, 50)
    .map(
      (sale) =>
        `${sale.tanggal} | ${sale.customer} bought ${sale.qty} of ${sale.kode_produk} (${sale.nama_barang}) totaling ${sale.total}`
    )
    .join("\n");

  const conversation =
    history
      .slice(-8)
      .map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`)
      .join("\n") || "No prior conversation.";

  return `
You are Sakura, a helpful assistant for the Aomori Vision inventory platform. Use the provided stock and sales data to answer user questions. Be concise and cite quantities or figures when available. If data is insufficient, explain what is missing.

Recent conversation:
${conversation}

Stock dataset snapshot:
${stockContext || "No stock records available."}

Sales dataset snapshot:
${salesContext || "No sales records available."}

User question: ${question}

Respond with actionable guidance grounded in the data above.
`.trim();
}
