"use client";
import dynamic from "next/dynamic";

// 1. Dynamically import the map and turn off SSR
const MapCanvas = dynamic(() => import("@/components/mapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-900 flex items-center justify-center text-gray-500 font-mono text-sm tracking-widest">
      INITIALIZING TACTICAL MAP...
    </div>
  ),
});
export default function fleet() {
  return <MapCanvas></MapCanvas>;
}
