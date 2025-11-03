import { getDashboardSummary } from "@/lib/data-store";

import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const summary = getDashboardSummary();
  return <DashboardClient summary={summary} />;
}
