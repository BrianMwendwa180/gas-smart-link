import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  hint?: ReactNode;
  tone?: "default" | "gas" | "petrol" | "warn" | "destructive";
  className?: string;
}

const TONE_CLASS = {
  default: "text-foreground",
  gas: "text-gas",
  petrol: "text-petrol",
  warn: "text-warn",
  destructive: "text-destructive",
} as const;

export function StatTile({ label, value, unit, hint, tone = "default", className }: StatTileProps) {
  return (
    <div className={cn("panel flex flex-col gap-1 px-4 py-3", className)}>
      <span className="label-caps">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("readout text-2xl font-semibold", TONE_CLASS[tone])}>{value}</span>
        {unit && <span className="readout text-xs text-muted-foreground">{unit}</span>}
      </div>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
