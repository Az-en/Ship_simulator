"use client";

import { PenLine, Eye, Pencil, Trash2, Lock } from "lucide-react";
import { RESTRICTED_ZONES, type RestrictedZone } from "@/lib/fleet-data";

const ZONE_COLOR: Record<RestrictedZone["type"], string> = {
  exclusion: "var(--status-critical)",
  caution: "var(--status-warning)",
  transit: "var(--status-info)",
};

export function ZonesPanel({ readOnly }: { readOnly?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {readOnly ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-card/50 px-3 py-2 text-[11px] text-muted-foreground">
          <Eye className="size-3.5 shrink-0" aria-hidden="true" />
          <span>Read-only overlay · Captain mode</span>
        </div>
      ) : (
        <button className="flex items-center justify-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20">
          <PenLine className="size-3.5" aria-hidden="true" />
          Draw Zone
        </button>
      )}

      <ul className="flex flex-col gap-1.5">
        {RESTRICTED_ZONES.map((zone) => (
          <li
            key={zone.id}
            className="flex items-center gap-2.5 rounded-md border border-border bg-card p-2.5"
          >
            <span
              className="size-3 shrink-0 rounded-sm"
              style={{
                backgroundColor: `color-mix(in oklch, ${ZONE_COLOR[zone.type]} 25%, transparent)`,
                border: `1.5px solid ${ZONE_COLOR[zone.type]}`,
              }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {zone.name}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {zone.type} · {zone.coordinates.length} pts
              </p>
            </div>
            {readOnly ? (
              <Lock
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              <div className="flex items-center gap-1">
                <button
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label={`Edit ${zone.name}`}
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-status-critical/15 hover:text-status-critical"
                  aria-label={`Delete ${zone.name}`}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
