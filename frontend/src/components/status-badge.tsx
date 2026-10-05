"use client";

import {
  Navigation,
  Anchor,
  Route,
  Siren,
  CircleStop,
  TriangleAlert,
  Fuel,
  type LucideIcon,
} from "lucide-react";
import { STATUS_META, type ShipStatus } from "@/lib/fleet-data";

export const STATUS_ICON: Record<ShipStatus, LucideIcon> = {
  normal: Navigation,
  arrived: Anchor,
  rerouting: Route,
  distressed: Siren,
  stopped: CircleStop,
  stranded: TriangleAlert,
  insufficient_fuel: Fuel,
};

export function StatusDot({ status }: { status: ShipStatus }) {
  return (
    <span
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ backgroundColor: STATUS_META[status].color }}
      aria-hidden="true"
    />
  );
}

export function StatusBadge({ status }: { status: ShipStatus }) {
  const meta = STATUS_META[status];
  const Icon = STATUS_ICON[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{
        color: meta.color,
        backgroundColor: `color-mix(in oklch, ${meta.color} 16%, transparent)`,
      }}
    >
      <Icon className="size-3" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
