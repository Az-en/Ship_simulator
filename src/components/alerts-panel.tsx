"use client"

import { AlertOctagon, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { ALERTS, type Alert, type AlertSeverity } from "@/lib/fleet-data"

const SEVERITY_META: Record<
  AlertSeverity,
  { color: string; icon: typeof Info; ring: string; bg: string }
> = {
  critical: {
    color: "text-status-critical",
    icon: AlertOctagon,
    ring: "border-status-critical/40",
    bg: "bg-status-critical/10",
  },
  warning: {
    color: "text-status-warning",
    icon: AlertTriangle,
    ring: "border-status-warning/40",
    bg: "bg-status-warning/10",
  },
  info: {
    color: "text-status-info",
    icon: Info,
    ring: "border-status-info/40",
    bg: "bg-status-info/10",
  },
}

interface AlertsPanelProps {
  selectedShipId: string | null
  onSelectShip: (id: string) => void
}

function AlertCard({
  alert,
  active,
  onSelect,
}: {
  alert: Alert
  active: boolean
  onSelect: () => void
}) {
  const meta = SEVERITY_META[alert.severity]
  const Icon = meta.icon
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full gap-2.5 rounded-md border p-2.5 text-left transition-colors",
        meta.ring,
        meta.bg,
        active && "ring-1 ring-primary",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", meta.color)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-xs font-semibold", meta.color)}>{alert.type}</span>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
            {alert.timestamp}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground text-pretty">
          {alert.message}
        </p>
      </div>
    </button>
  )
}

export function AlertsPanel({ selectedShipId, onSelectShip }: AlertsPanelProps) {
  return (
    <ul className="flex flex-col gap-2">
      {ALERTS.map((alert) => (
        <li key={alert.id}>
          <AlertCard
            alert={alert}
            active={!!alert.shipId && alert.shipId === selectedShipId}
            onSelect={() => alert.shipId && onSelectShip(alert.shipId)}
          />
        </li>
      ))}
    </ul>
  )
}
