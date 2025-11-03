import { TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KPIcardProps = {
  title: string;
  value: string;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  helper?: string;
  className?: string;
};

export function KPIcard({ title, value, changeLabel, trend = "neutral", helper, className }: KPIcardProps) {
  const icon =
    trend === "up" ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : trend === "down" ? <TrendingDown className="h-4 w-4 text-rose-500" /> : null;

  return (
    <Card className={cn("border-border/70 bg-card/90", className)}>
      <CardHeader className="space-y-1">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="flex items-baseline gap-2 text-3xl">{value}</CardTitle>
        {changeLabel ? (
          <Badge variant="secondary" className="inline-flex items-center gap-1">
            {icon}
            {changeLabel}
          </Badge>
        ) : null}
      </CardHeader>
      {helper ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">{helper}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}
