"use client";

import { Crosshair, Anchor, MapPin } from "lucide-react";
import FleetPanel from "@/components/fleet-panel";
import { useFleetStore } from "@/stores/fleetStore";
import { useRoleStore } from "@/stores/role";
import { ShipDetailsPanel } from "@/components/ship-details-panel";
import { CommandControlsPanel } from "@/components/command-controls-panel";

export default function Sidebar() {
  const selectedShipId = useFleetStore((state) => state.selectedShipId);
  const SHIPS = useFleetStore((state) => state.fleetUpdates);
  const role = useRoleStore((state) => state.role);

  const selectedShip = SHIPS.find((s) => s.shipId === selectedShipId);

  return (
    <aside className="w-105 h-full bg-gray-900/40 border-l border-gray-800 flex flex-col overflow-y-auto px-4 py-4 gap-y-4 shrink-0">
      {/* SECTION 3: Fleet Overview / My Vessel */}
      <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-1 flex-1 flex flex-col min-h-75">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold tracking-widest p-2 text-gray-400 uppercase flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />{" "}
            {role === "CAPTAIN" ? "My Vessel" : "Fleet Overview"}
          </h3>
          <span className="bg-gray-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-400">
            {role === "CAPTAIN" ? 1 : SHIPS.length}
          </span>
        </div>

        {/* Scrollable list wrapper */}
        <div className="overflow-y-auto pr-1 flex-1">
          <FleetPanel />
        </div>
      </div>

      {/* SECTION 2: Selected Vessel / Vessel Status */}
      <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-4">
        <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3 flex items-center gap-2">
          <Crosshair className="h-3 w-3 text-emerald-500" />{" "}
          {role === "CAPTAIN" ? "Vessel Details" : "Selected Vessel"}
        </h3>

        <ShipDetailsPanel ship={selectedShip || null} />
      </div>

      {/* SECTION 1: Command Controls */}
      <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-4">
        <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3 flex items-center gap-2">
          <Anchor className="h-3 w-3 text-blue-500" /> Command Controls
        </h3>

        <CommandControlsPanel
          selectedShipId={selectedShipId}
          ship={selectedShip || null}
          readOnly={role === "CAPTAIN"}
        />
      </div>
    </aside>
  );
}
