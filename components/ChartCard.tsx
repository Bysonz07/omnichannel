import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function ChartCard({ title, description, action, children, className }: ChartCardProps) {
  return (
    <Card className={cn("border-border/70 bg-card/90", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">{children}</div>
      </CardContent>
    </Card>
  );
}
