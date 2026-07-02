"use client";

import { Crosshair, Anchor, MapPin } from "lucide-react";
import FleetPanel from "@/components/fleet-panel";
import { useFleetStore } from "@/stores/fleetStore";
export default function Sidebar() {
  const selectedShipId = useFleetStore((state) => state.selectedShipId);

  const SHIPS = useFleetStore((state) => state.fleetUpdates);
  const selectedShip = SHIPS.find((s) => s.shipId === selectedShipId);

  return (
    <aside className="w-105 h-full bg-gray-900/40 border-l border-gray-800 flex flex-col overflow-y-auto px-4 py-4 gap-y-4 shrink-0">
      {/* SECTION 3: Fleet Overview (Modular Component Integration) */}
      <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-1 flex-1 flex flex-col min-h-75">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold tracking-widest p-2 text-gray-400 uppercase flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" /> Fleet Overview
          </h3>
          <span className="bg-gray-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-400">
            {SHIPS.length}
          </span>
        </div>

        {/* Scrollable list wrapper */}
        <div className="overflow-y-auto pr-1 flex-1">
          {/* Your modular FleetPanel goes here! */}
          <FleetPanel />
        </div>
      </div>
      <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-4">
        <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3 flex items-center gap-2">
          <Crosshair className="h-3 w-3 text-emerald-500" /> Selected Vessel
        </h3>

        {selectedShip ? (
          <div className="border border-gray-800 rounded-lg py-6 px-4 text-center">
            <div className="text-lg font-bold text-white mb-1">
              {selectedShip.name}
            </div>
            <div className="text-xs text-gray-400 font-mono">
              ID: {selectedShip.shipId}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-gray-800 rounded-lg py-8 px-4 text-center text-sm text-gray-500">
            Select a vessel on the map or fleet list to inspect details.
          </div>
        )}
      </div>

      {/* SECTION 2: Command Controls */}
      <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-4">
        <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3 flex items-center gap-2">
          <Anchor className="h-3 w-3 text-blue-500" /> Command Controls
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              New Destination
            </label>
            <div className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-sm text-gray-400 flex justify-between items-center cursor-pointer">
              <span>Select port...</span>
              <span className="text-xs text-gray-600">▼</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="bg-gray-700 hover:bg-gray-600 font-bold text-xs py-2.5 px-4 rounded-lg text-white transition-colors">
              Set Course
            </button>
            <button className="border border-gray-800 hover:bg-gray-900 font-bold text-xs py-2.5 px-4 rounded-lg text-gray-300 transition-colors">
              Reroute
            </button>
          </div>

          <button className="w-full border border-amber-900/40 bg-amber-950/20 text-amber-500 font-bold text-xs py-2.5 rounded-lg hover:bg-amber-950/40 transition-colors">
            Hold Position
          </button>
        </div>
      </div>
    </aside>
  );
}
