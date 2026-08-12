"use client";

import {
  MapPin,
  Milestone,
  Hand,
  Repeat2,
  ChevronDown,
  Lock,
} from "lucide-react";
import { PORTS } from "@/lib/fleet-data";
import { ShipConfig } from "@/types/ship";

interface CommandControlsPanelProps {
  ship: ShipConfig | null;
  readOnly?: boolean;
}

export function CommandControlsPanel({
  ship,
  readOnly,
}: CommandControlsPanelProps) {
  const disabled = !ship || readOnly;

  if (readOnly) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-slate-800 bg-slate-950/20 px-3 py-3 text-xs text-slate-500">
        <Lock className="size-4 shrink-0" aria-hidden="true" />
        <span className="text-pretty">
          Command directives are disabled in Captain mode.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* New destination */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold font-mono">
          New Destination
        </label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
          <select
            disabled={disabled}
            defaultValue={ship?.destination ?? ""}
            className="w-full appearance-none rounded-md border border-slate-800 bg-slate-950/40 py-2 pl-8 pr-8 text-xs text-slate-200 outline-none focus:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Select port…
            </option>
            {PORTS.map((p) => (
              <option
                key={p.code}
                value={p.code}
                className="bg-gray-900 text-white"
              >
                {p.name} ({p.code})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
        </div>
      </div>

      {/* Waypoint */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold font-mono">
          Add Waypoint (lat, lng)
        </label>
        <div className="flex gap-2">
          <input
            disabled={disabled}
            placeholder="26.5000"
            className="w-full rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-2 font-mono text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <input
            disabled={disabled}
            placeholder="56.2500"
            className="w-full rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-2 font-mono text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Milestone className="size-3.5" aria-hidden="true" />
          Set Course
        </button>
        <button
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Repeat2 className="size-3.5" aria-hidden="true" />
          Reroute
        </button>
        <button
          disabled={disabled}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-md border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs font-semibold text-amber-500 transition-colors hover:bg-amber-950/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Hand className="size-3.5" aria-hidden="true" />
          Hold Position
        </button>
      </div>
    </div>
  );
}
