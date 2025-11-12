import type { LucideIcon } from "lucide-react";
import { BarChart3, Home, UploadCloud } from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
};

export const primaryNavigation: NavigationItem[] = [
  {
    href: "/",
    label: "Overview",
    icon: Home,
    description: "Landing page & platform intro."
  },
  {
    href: "/upload",
    label: "Upload Data",
    icon: UploadCloud,
    description: "Import CSV/XLSX/PDF ledgers."
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: BarChart3,
    description: "Insights, KPIs, and linked ledgers."
  }
];
