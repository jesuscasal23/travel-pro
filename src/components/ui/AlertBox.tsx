import { AlertTriangle, AlertCircle, Info, type LucideIcon } from "lucide-react";

const variantConfig: Record<string, { icon: LucideIcon; iconClassName: string }> = {
  warning: { icon: AlertTriangle, iconClassName: "text-accent" },
  error: { icon: AlertCircle, iconClassName: "text-accent" },
  info: { icon: Info, iconClassName: "text-muted-foreground" },
};

interface AlertBoxProps {
  variant: "warning" | "error" | "info";
  title: string;
  description?: string;
  className?: string;
}

export function AlertBox({ variant, title, description, className }: AlertBoxProps) {
  const { icon: Icon, iconClassName } = variantConfig[variant];

  return (
    <div
      className={`border-border bg-background flex items-start gap-2.5 rounded-lg border p-3 ${className ?? ""}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${iconClassName}`} />
      <div>
        <p className="text-foreground text-sm font-medium">{title}</p>
        {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
      </div>
    </div>
  );
}
