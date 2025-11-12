import { NextResponse } from "next/server";

import { getSales, setSales, validateSalesPayload } from "@/lib/data-store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    data: await getSales()
  });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = validateSalesPayload(payload);
    await setSales(data);
    return NextResponse.json(
      {
        message: "Sales dataset updated",
        count: data.length
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 400 });
  }
}
