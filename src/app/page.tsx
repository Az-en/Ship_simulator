"use client";

import Link from "next/link";
import { useRoleStore } from "@/stores/role";
export default function Home() {
  // extract the functionality into an object

  const role = useRoleStore((state) => state.role);
  const setCommand = useRoleStore((state) => state.setCommand);
  const setCaptain = useRoleStore((state) => state.setCaptain);
  return (
    <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center justify-center gap-y-6">
      <div className="text-center">
        <h1 className="text-5xl text-white font-bold mb-2">Command Centre</h1>
        <p className="text-gray-400 text-sm tracking-wide">
          Select your role to access the fleet management system
        </p>
      </div>

      {/* Container to put both options in the same row with a gap */}
      <div className="flex flex-row gap-x-6 w-full max-w-2xl justify-center px-4">
        <Link
          href="/fleet"
          className="flex-1 max-w-xs bg-blue-900 hover:bg-blue-800 transition-colors duration-200 text-center py-10 border border-blue-800 rounded-lg text-white font-bold cursor-pointer shadow-lg hover:shadow-blue-900/50"
          onClick={() => setCommand()}
        >
          Command Center
        </Link>

        <Link
          href="/fleet"
          className="flex-1 max-w-xs bg-orange-600 hover:bg-orange-500 transition-colors duration-200 text-center py-10 border border-orange-500 rounded-lg text-white font-bold cursor-pointer shadow-lg hover:shadow-orange-600/50"
          onClick={() => setCaptain()}
        >
          Captain
        </Link>
      </div>
    </div>
  );
}
