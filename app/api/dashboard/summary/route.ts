import { NextResponse } from "next/server";

import { getDashboardSummary } from "@/lib/data-store";

export async function GET() {
  const summary = getDashboardSummary();
  return NextResponse.json(summary);
}
