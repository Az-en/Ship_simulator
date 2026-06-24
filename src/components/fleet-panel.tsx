"use client";

import { Compass, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_META, portByCode, type Ship } from "@/lib/fleet-data";
import { StatusBadge } from "@/components/status-badge";

function FuelBar({ fuel, capacity }: { fuel: number; capacity: number }) {
  const pct = Math.max(0, Math.min(100, (fuel / capacity) * 100));
  const color =
    pct <= 10
      ? "var(--status-critical)"
      : pct <= 30
        ? "var(--status-warning)"
        : "var(--status-normal)";
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

interface FleetPanelProps {
  ships: Ship[];
  selectedShipId: string | null;
  onSelectShip: (id: string) => void;
}

export function FleetPanel({
  ships,
  selectedShipId,
  onSelectShip,
}: FleetPanelProps) {
  return (
    <ul className="flex flex-col gap-1.5">
      {ships.map((ship) => {
        const dest = portByCode(ship.destination);
        const isSel = ship.id === selectedShipId;
        const pct = Math.round((ship.fuel / ship.fuelCapacity) * 100);
        return (
          <li key={ship.id}>
            <button
              onClick={() => onSelectShip(ship.id)}
              className={cn(
                "w-full rounded-md border p-2.5 text-left transition-colors",
                isSel
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-card hover:border-border hover:bg-accent/40",
              )}
              style={
                isSel
                  ? {
                      borderColor:
                        "color-mix(in oklch, var(--primary) 60%, transparent)",
                    }
                  : undefined
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS_META[ship.status].color }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-medium text-foreground">
                    {ship.name}
                  </span>
                </div>
                <StatusBadge status={ship.status} />
              </div>

              <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Gauge className="size-3" aria-hidden="true" />
                  {ship.speed.toFixed(1)} kn
                </span>
                <span className="flex items-center gap-1">
                  <Compass className="size-3" aria-hidden="true" />
                  {ship.heading.toString().padStart(3, "0")}&deg;
                </span>
                <span className="ml-auto font-mono">
                  &rarr; {dest?.code ?? "—"}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <FuelBar fuel={ship.fuel} capacity={ship.fuelCapacity} />
                <span className="w-9 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                  {pct}%
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
