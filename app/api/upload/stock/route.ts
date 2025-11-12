import { NextResponse } from "next/server";

import { getStock, setStock, validateStockPayload } from "@/lib/data-store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    data: await getStock()
  });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = validateStockPayload(payload);
    await setStock(data);
    return NextResponse.json(
      {
        message: "Stock dataset updated",
        count: data.length
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 400 });
  }
}
