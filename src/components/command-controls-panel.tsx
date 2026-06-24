"use client"

import { MapPin, Milestone, Hand, Repeat2, ChevronDown, Lock } from "lucide-react"
import { PORTS, type Ship } from "@/lib/fleet-data"

interface CommandControlsPanelProps {
  ship: Ship | null
  readOnly?: boolean
}

export function CommandControlsPanel({ ship, readOnly }: CommandControlsPanelProps) {
  const disabled = !ship || readOnly

  if (readOnly) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-card/50 px-3 py-3 text-xs text-muted-foreground">
        <Lock className="size-4 shrink-0" aria-hidden="true" />
        <span className="text-pretty">Command directives are disabled in Captain mode.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* New destination */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          New Destination
        </label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <select
            disabled={disabled}
            defaultValue={ship?.destination ?? ""}
            className="w-full appearance-none rounded-md border border-border bg-muted py-2 pl-8 pr-8 text-xs text-foreground outline-none focus:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Select port…
            </option>
            {PORTS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Waypoint */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Add Waypoint (lat, lng)
        </label>
        <div className="flex gap-2">
          <input
            disabled={disabled}
            placeholder="26.5000"
            className="w-full rounded-md border border-border bg-muted px-2.5 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <input
            disabled={disabled}
            placeholder="56.2500"
            className="w-full rounded-md border border-border bg-muted px-2.5 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Milestone className="size-3.5" aria-hidden="true" />
          Set Course
        </button>
        <button
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Repeat2 className="size-3.5" aria-hidden="true" />
          Reroute
        </button>
        <button
          disabled={disabled}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-md border border-status-warning/40 bg-status-warning/10 px-3 py-2 text-xs font-semibold text-status-warning transition-colors hover:bg-status-warning/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Hand className="size-3.5" aria-hidden="true" />
          Hold Position
        </button>
      </div>
    </div>
  )
}
