"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRoleStore } from "@/stores/role";

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

export default function Home() {
  const router = useRouter();
  const setCommand = useRoleStore((state) => state.setCommand);
  const setCaptain = useRoleStore((state) => state.setCaptain);
  const [selectedShipId, setSelectedShipId] = useState("MV-1");

  const handleCaptainProceed = () => {
    setCaptain(selectedShipId);
    router.push("/fleet");
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center justify-center gap-y-6">
      <div className="text-center">
        <h1 className="text-5xl text-white font-bold mb-2">Command Centre</h1>
        <p className="text-gray-400 text-sm tracking-wide">
          Select your role to access the fleet management system
        </p>
      </div>

      {/* Container to put both options in the same row with a gap */}
      <div className="flex flex-row gap-x-6 w-full max-w-2xl justify-center px-4 items-stretch">
        <Link
          href="/fleet"
          className="flex-1 max-w-xs bg-blue-950/60 hover:bg-blue-900/60 transition-colors duration-200 text-center py-10 px-6 border border-blue-800 rounded-lg text-white font-bold cursor-pointer shadow-lg hover:shadow-blue-900/50 flex flex-col items-center justify-center gap-y-4"
          onClick={() => setCommand()}
        >
          <div className="text-blue-400 uppercase tracking-wider">
            Command Center
          </div>
          <div className="text-xs font-normal text-gray-400 normal-case leading-relaxed">
            Monitor and coordinate the entire commercial fleet. Draw exclusion
            zones, set new courses, and respond to distress signals.
          </div>
        </Link>

        <div className="flex-1 max-w-xs bg-orange-950/40 border border-orange-900/80 rounded-lg text-white p-6 flex flex-col justify-between shadow-lg hover:shadow-orange-900/20 transition-all">
          <div className="text-center font-bold text-orange-400 uppercase tracking-wider mb-2">
            Captain
          </div>
          <div className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
            Command your individual vessel. Receive navigation directives and
            raise distress alerts.
          </div>

          <div className="w-full mb-6">
            <label className="text-[10px] text-orange-300 font-bold tracking-widest mb-1.5 block text-left uppercase font-mono">
              Assigned Vessel
            </label>
            <select
              value={selectedShipId}
              onChange={(e) => setSelectedShipId(e.target.value)}
              className="w-full bg-gray-900/80 border border-orange-900/60 rounded-lg px-3 py-2.5 text-sm text-orange-100 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {REAL_SHIPS.map((ship) => (
                <option
                  key={ship.id}
                  value={ship.id}
                  className="bg-gray-950 text-orange-100"
                >
                  {ship.name} ({ship.id})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCaptainProceed}
            className="w-full bg-orange-600 hover:bg-orange-500 transition-colors duration-200 py-2.5 rounded-lg font-bold text-sm cursor-pointer shadow-md hover:shadow-orange-600/30"
          >
            Access Board
          </button>
        </div>
      </div>
    </div>
  );
}
