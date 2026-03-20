import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DevelopmentTag } from "@/components/v2/ui/DevelopmentTag";

export interface MenuSectionItem {
  icon: LucideIcon;
  label: string;
  isMock?: boolean;
}

export interface MenuSectionProps {
  title: string;
  items: MenuSectionItem[];
}

export function MenuSection({ title, items }: MenuSectionProps) {
  return (
    <div className="mt-6 px-6">
      <p className="text-v2-text-muted mb-3 text-xs font-bold tracking-wider uppercase">{title}</p>
      <div className="border-v2-border divide-v2-border divide-y rounded-xl border bg-white">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-4 px-4 py-4">
            <item.icon size={20} className="text-v2-text-muted shrink-0" />
            <div className="flex flex-1 items-center gap-2">
              <span className="text-v2-navy text-sm font-medium">{item.label}</span>
              {item.isMock && <DevelopmentTag label="Mock" />}
            </div>
            <ChevronRight size={16} className="text-v2-text-light shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
