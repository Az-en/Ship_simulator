"use client";

import {
  MousePointerClick,
  Navigation,
  Anchor,
  Route,
  Siren,
  CircleStop,
} from "lucide-react";
import { ShipConfig, Status } from "@/types/ship";
import { useCoordinatesStore } from "@/stores/coordinatesStore";

// Mapping for Status Icons
const STATUS_ICON: Record<Status, any> = {
  [Status.NORMAL]: Navigation,
  [Status.REROUTING]: Route,
  [Status.DISTRESSED]: Siren,
  [Status.STOPPED]: CircleStop,
  [Status.ARRIVED]: Anchor,
};

// Mapping for Status Colors/Styles
const STATUS_STYLES: Record<
  Status,
  { label: string; text: string; bg: string }
> = {
  [Status.NORMAL]: {
    label: "Normal",
    text: "text-green-400 border-green-500/30",
    bg: "bg-green-500/10",
  },
  [Status.REROUTING]: {
    label: "Rerouting",
    text: "text-blue-400 border-blue-500/30",
    bg: "bg-blue-500/10",
  },
  [Status.DISTRESSED]: {
    label: "Distressed",
    text: "text-red-400 border-red-500/30 animate-pulse",
    bg: "bg-red-500/10",
  },
  [Status.STOPPED]: {
    label: "Stopped",
    text: "text-amber-400 border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  [Status.ARRIVED]: {
    label: "Arrived",
    text: "text-purple-400 border-purple-500/30",
    bg: "bg-purple-500/10",
  },
};

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
      <span className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span
        className={`text-xs text-slate-200 ${mono ? "font-mono tabular-nums" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function ShipDetailsPanel({ ship }: { ship: ShipConfig | null }) {
  const ports = useCoordinatesStore((state) => state.ports);

  if (!ship) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-800 bg-slate-950/20 px-4 py-8 text-center">
        <MousePointerClick
          className="size-5 text-slate-600 animate-pulse"
          aria-hidden="true"
        />
        <p className="text-xs text-slate-500 text-pretty">
          Select a vessel on the map or fleet list to inspect details.
        </p>
      </div>
    );
  }

  // Handle conversion of casing just in case
  const rawStatus = (ship.status || Status.NORMAL).toString().toLowerCase();
  let currentStatus = Status.NORMAL;
  if (rawStatus === "rerouting") currentStatus = Status.REROUTING;
  else if (rawStatus === "distressed") currentStatus = Status.DISTRESSED;
  else if (rawStatus === "stopped") currentStatus = Status.STOPPED;
  else if (rawStatus === "arrived") currentStatus = Status.ARRIVED;

  const statusMeta =
    STATUS_STYLES[currentStatus] || STATUS_STYLES[Status.NORMAL];
  const Icon = STATUS_ICON[currentStatus] || STATUS_ICON[Status.NORMAL];

  const destPort = ports.find(
    (p) => p.id === ship.destination || p.name === ship.destination,
  );
  const destLabel = destPort
    ? `${destPort.name} (${destPort.id})`
    : ship.destination;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-800 bg-slate-950/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{ship.name}</h3>
          <p className="font-mono text-[11px] text-slate-500">{ship.shipId}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusMeta.text} ${statusMeta.bg}`}
        >
          <Icon className="size-3" aria-hidden="true" />
          {statusMeta.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-800 pt-3">
        <Field label="Cargo" value={ship.cargo} />
        <Field label="Speed" value={`${ship.speed} kn`} mono />
        <Field label="Heading" value={`${ship.heading}°`} mono />
        <Field label="Destination" value={destLabel} />
        <Field label="Fuel Remaining" value={`${ship.fuel}%`} mono />
        <Field
          label="Latitude"
          value={`${ship.position[0].toFixed(4)}° N`}
          mono
        />
        <Field
          label="Longitude"
          value={`${ship.position[1].toFixed(4)}° E`}
          mono
        />
      </div>
    </div>
  );
}
