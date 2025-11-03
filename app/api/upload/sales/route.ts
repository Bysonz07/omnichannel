import { NextResponse } from "next/server";

import { getSales, setSales, validateSalesPayload } from "@/lib/data-store";

export async function GET() {
  return NextResponse.json({
    data: getSales()
  });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = validateSalesPayload(payload);
    setSales(data);
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
