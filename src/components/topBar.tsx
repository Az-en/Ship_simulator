"use client";
import { useState } from "react";
import { Anchor, Radio } from "lucide-react";

export default function TopBar() {
  const [role, setRole] = useState("command");
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
        <div className="flex items-center bg-gray-900/50 border border-gray-800 rounded-xl p-1 text-sm font-medium">
          <button
            onClick={() => setRole("command")}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all duration-200 ${
              role === "command"
                ? "bg-gray-200 text-gray-900 shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Command
          </button>

          <button
            onClick={() => setRole("captain")}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all duration-200 ${
              role === "captain"
                ? "bg-gray-200 text-gray-900 shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Captain
          </button>
        </div>

        {/* 2. Link Status Badge */}
        <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2 text-sm font-semibold text-white">
          <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
          <span>Link Secure</span>
          <span className="relative flex h-2 w-2 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
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
