"use client";
import { Anchor, Radio } from "lucide-react";
import { useFleetStore } from "@/stores/fleetStore";
import { useRoleStore } from "@/stores/role";
export default function TopBar() {
  const role = useRoleStore((state) => state.role);
  const captainShipId = useRoleStore((state) => state.captainShipId);
  const setCommand = useRoleStore((state) => state.setCommand);
  const setCaptain = useRoleStore((state) => state.setCaptain);
  const setCaptainShipId = useRoleStore((state) => state.setCaptainShipId);
  const isConnected = useFleetStore((state) => state.isConnected);
  const startSimulator = useFleetStore((state) => state.startSimulator);

  const REAL_SHIPS = [
    { id: "MV-1", name: "Aurora" },
    { id: "MV-2", name: "Borealis" },
    { id: "MV-3", name: "Cygnus" },
    { id: "MV-4", name: "Dragon" },
    { id: "MV-5", name: "Emerald" },
    { id: "MV-6", name: "Falcon" },
    { id: "MV-7", name: "Gharial" },
    { id: "MV-8", name: "Halcyon" },
    { id: "MV-9", name: "Iris" },
    { id: "MV-10", name: "Jade" },
    { id: "MV-11", name: "Kite" },
    { id: "MV-12", name: "Lotus" },
    { id: "MV-13", name: "Mirage" },
    { id: "MV-14", name: "Nova" },
    { id: "MV-15", name: "Orca" },
  ];

  return (
    <div className="h-16 w-full flex items-center justify-between bg-gray-950 border-b border-gray-800 px-6">
      {/* Left Side: Logo/Brand */}
      <div className="flex items-center gap-2">
        <Anchor className="h-6 w-6 text-emerald-400" />
        <span className="text-white font-semibold text-lg tracking-wider">
          FleetOS
        </span>
      </div>

      <div className="flex items-center gap-6">
        {role === "COMMAND" ? (
          <button
            onClick={startSimulator}
            className="px-4 py-1.5 bg-gray-900/50 border border-gray-800 rounded-xl p-1 text-sm font-medium hover:bg-gray-800/80 transition-colors"
          >
            Start Simulator
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-gray-900/50 border border-orange-900/60 rounded-xl px-3 py-1.5 text-sm">
            <span className="text-orange-400 font-bold uppercase tracking-wider text-[10px] font-mono">
              Commanding:
            </span>
            <select
              value={captainShipId || ""}
              onChange={(e) => setCaptainShipId(e.target.value)}
              className="bg-transparent text-white font-semibold outline-none border-none cursor-pointer pr-4 text-xs focus:ring-0"
            >
              {REAL_SHIPS.map((ship) => (
                <option
                  key={ship.id}
                  value={ship.id}
                  className="bg-gray-950 text-white"
                >
                  {ship.name} ({ship.id})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center bg-gray-900/50 border border-gray-800 rounded-xl p-1 text-sm font-medium">
          <button
            onClick={() => setCommand()}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all duration-200 ${
              role === "COMMAND"
                ? "bg-gray-200 text-gray-900 shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Command
          </button>

          <button
            onClick={() => setCaptain()}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all duration-200 ${
              role === "CAPTAIN"
                ? "bg-gray-200 text-gray-900 shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Captain
          </button>
        </div>

        {/* 2. Link Status Badge */}
        <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2 text-sm font-semibold text-white">
          <Radio
            className={`h-4 w-4 ${isConnected ? "text-emerald-500 animate-pulse" : "text-rose-500"}`}
          />
          <span className={!isConnected ? "text-rose-400" : ""}>
            {isConnected ? "Link Secure" : "Link Not Working"}
          </span>
          <span className="relative flex h-2 w-2 ml-1">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-emerald-500" : "bg-rose-500"}`}
            />
          </span>
        </div>

        {/* 3. UTC / ZULU Clock */}
        <div className="flex flex-col items-end justify-center leading-none">
          <span className="text-xl text-white font-mono font-bold tracking-wider">
            13:17:07
          </span>
          <span className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">
            UTC · ZULU
          </span>
        </div>
      </div>
    </div>
  );
}
