"use client";

import { MousePointerClick } from "lucide-react";
import { STATUS_META, portByCode, type Ship } from "@/lib/fleet-data";
import { StatusBadge } from "@/components/status-badge";

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-xs text-foreground ${mono ? "font-mono tabular-nums" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function ShipDetailsPanel({ ship }: { ship: Ship | null }) {
  if (!ship) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card/50 px-4 py-8 text-center">
        <MousePointerClick
          className="size-5 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-xs text-muted-foreground text-pretty">
          Select a vessel on the map or fleet list to inspect details.
        </p>
      </div>
    );
  }

  const dest = portByCode(ship.destination);
  const fuelPct = Math.round((ship.fuel / ship.fuelCapacity) * 100);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{ship.name}</h3>
          <p className="font-mono text-[11px] text-muted-foreground">
            {ship.id}
          </p>
        </div>
        <StatusBadge status={ship.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3">
        <Field
          label="Operational Status"
          value={STATUS_META[ship.status].label}
        />
        <Field label="Cargo" value={ship.cargo} />
        <Field label="Speed" value={`${ship.speed.toFixed(1)} kn`} mono />
        <Field
          label="Heading"
          value={`${ship.heading.toString().padStart(3, "0")}°`}
          mono
        />
        <Field
          label="Destination"
          value={dest ? `${dest.name} (${dest.code})` : "—"}
        />
        <Field
          label="Fuel Remaining"
          value={`${ship.fuel.toLocaleString()} t · ${fuelPct}%`}
          mono
        />
        <Field label="Latitude" value={`${ship.lat.toFixed(4)}° N`} mono />
        <Field label="Longitude" value={`${ship.lng.toFixed(4)}° E`} mono />
      </div>
    </div>
  );
}
