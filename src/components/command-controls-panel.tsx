"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Milestone,
  Hand,
  Repeat2,
  ChevronDown,
  Lock,
  Play,
} from "lucide-react";
import { PORTS as FALLBACK_PORTS } from "@/lib/fleet-data";
import { ShipConfig, Status } from "@/types/ship";
import { useFleetStore } from "@/stores/fleetStore";
import { useCoordinatesStore } from "@/stores/coordinatesStore";
import { toast } from "sonner";

interface CommandControlsPanelProps {
  selectedShipId?: string | null;
  ship: ShipConfig | null;
  readOnly?: boolean;
}

export function CommandControlsPanel({
  selectedShipId,
  ship,
  readOnly,
}: CommandControlsPanelProps) {
  const socket = useFleetStore((state) => state.socket);
  const backendPorts = useCoordinatesStore((state) => state.ports);

  // Normalize port list from coordinates store or fallback
  const portsList =
    backendPorts && backendPorts.length > 0
      ? backendPorts
      : FALLBACK_PORTS.map((p) => ({
          id: p.code,
          name: p.name,
          position: [p.lat, p.lng] as [number, number],
        }));

  const effectiveShipId = selectedShipId ?? ship?.shipId ?? null;
  const disabled = !effectiveShipId || readOnly;

  const [selectedPort, setSelectedPort] = useState<string>("");

  // Sync selected destination port with current ship's destination
  useEffect(() => {
    if (ship?.destination) {
      setSelectedPort(ship.destination);
    } else {
      setSelectedPort("");
    }
  }, [ship?.shipId, ship?.destination, selectedShipId]);

  const handleHoldPosition = () => {
    if (!effectiveShipId) {
      toast.error("No vessel selected to command");
      return;
    }

    // Guard clause: check if ship is already stopped
    const isAlreadyStopped =
      ship?.status === Status.STOPPED ||
      String(ship?.status).toUpperCase() === "STOPPED";

    if (isAlreadyStopped) {
      toast.info("Ship already Stopped");
      return;
    }

    if (!socket) {
      toast.error("Cannot send directive: Socket is not connected");
      return;
    }

    socket.emit("DirectiveStop", { shipId: effectiveShipId }, (ack?: any) => {
      if (ack?.error) {
        toast.error(ack.error);
      }
    });

    const shipName = ship?.name || effectiveShipId;
    toast.success(`Directive sent: Hold Position for ${shipName}`);
  };

  const handleResumeCourse = () => {
    if (!effectiveShipId) {
      toast.error("No vessel selected to command");
      return;
    }

    const shipName = ship?.name || effectiveShipId;

    // Guard clause: check if ship is already normal
    const isAlreadyNormal =
      ship?.status === Status.NORMAL ||
      String(ship?.status).toUpperCase() === "NORMAL";

    if (isAlreadyNormal) {
      toast.info(`Ship: ${shipName} is already on course (Status: NORMAL)`);
      return;
    }

    if (!socket) {
      toast.error("Cannot send directive: Socket is not connected");
      return;
    }

    socket.emit("DirectiveResume", { shipId: effectiveShipId }, (ack?: any) => {
      if (ack?.error) {
        toast.error(ack.error);
      }
    });

    toast.success(`Directive sent: Resume Course for ${shipName}`);
  };

  const handleSetCourse = () => {
    if (!effectiveShipId) {
      toast.error("No vessel selected to command");
      return;
    }

    if (!selectedPort) {
      toast.error("Please select a destination port");
      return;
    }

    const shipName = ship?.name || effectiveShipId;
    const currentPort = portsList.find((p) => p.id === ship?.destination);
    const newPort = portsList.find((p) => p.id === selectedPort);
    const portDisplayName = currentPort?.name || ship?.destination || selectedPort;

    // Guard clause: check if the new selectedPort is the same as the current destination
    if (selectedPort === ship?.destination) {
      toast.info(
        `Ship: ${shipName} is already travelling to selected Port: ${portDisplayName}`,
      );
      return;
    }

    if (!socket) {
      toast.error("Cannot send directive: Socket is not connected");
      return;
    }

    socket.emit(
      "DirectiveNewCourse",
      {
        shipId: effectiveShipId,
        portId: selectedPort,
        destination: selectedPort,
        portName: newPort?.name || selectedPort,
      },
      (ack?: any) => {
        if (ack?.error) {
          toast.error(ack.error);
        }
      },
    );

    toast.success(
      `Directive sent: Course set to ${newPort?.name || selectedPort} for ${shipName}`,
    );
  };

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
      {/* Active Vessel Indicator */}
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-slate-500 uppercase tracking-wider">
          Target Vessel:
        </span>
        <span
          className={`font-semibold px-1.5 py-0.5 rounded ${
            effectiveShipId
              ? "bg-blue-950/60 border border-blue-800/60 text-blue-300"
              : "bg-slate-900 border border-slate-800 text-slate-500"
          }`}
        >
          {effectiveShipId
            ? `${ship?.name ? `${ship.name} (${effectiveShipId})` : effectiveShipId}`
            : "No Vessel Selected"}
        </span>
      </div>

      {/* New destination */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold font-mono">
          New Destination
        </label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
          <select
            disabled={disabled}
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            className="w-full appearance-none rounded-md border border-slate-800 bg-slate-950/40 py-2 pl-8 pr-8 text-xs text-slate-200 outline-none focus:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Select port…
            </option>
            {portsList.map((p) => (
              <option
                key={p.id}
                value={p.id}
                className="bg-gray-900 text-white"
              >
                {p.name} ({p.id})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={handleSetCourse}
          className="flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Milestone className="size-3.5" aria-hidden="true" />
          Set Course
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={handleSetCourse}
          className="flex items-center justify-center gap-1.5 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Repeat2 className="size-3.5" aria-hidden="true" />
          Reroute
        </button>

        {/* Hold Position Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={handleHoldPosition}
          className="flex items-center justify-center gap-1.5 rounded-md border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-950/40 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Hand className="size-3.5" aria-hidden="true" />
          Hold Position
        </button>

        {/* Resume Course Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={handleResumeCourse}
          className="flex items-center justify-center gap-1.5 rounded-md border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-950/40 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play className="size-3.5" aria-hidden="true" />
          Resume Course
        </button>
      </div>
    </div>
  );
}
