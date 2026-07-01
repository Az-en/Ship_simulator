"use client";

import { useEffect, useRef } from "react";
import { useFleetStore } from "@/stores/fleetStore";
import { useCoordinatesStore } from "@/stores/coordinatesStore";
import { getBB, getNavigableWater, getPorts } from "@/api/coordinates";
import { toast, Toaster } from "sonner";
export default function AppInitializer() {
  const initSocket = useFleetStore((state) => state.initSocket);
  const setBoundingBox = useCoordinatesStore((state) => state.setBoundingBox);
  const setNavigableWater = useCoordinatesStore(
    (state) => state.setNavigableWater,
  );
  const setPorts = useCoordinatesStore((state) => state.setPorts);

  // A ref to ensure we only fetch data once in strict mode
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // 1. Fire up the socket connection
    initSocket();

    // 2. Fetch the map data globally
    const fetchAndStoreCoordinates = async () => {
      try {
        const bbData = await getBB();
        const waterData = await getNavigableWater();
        const portsData = await getPorts();

        setBoundingBox(bbData);
        setNavigableWater(waterData);
        setPorts(portsData);
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "Unexpected error occured";
        toast.error(msg, { position: "top-left" });
      }
    };

    fetchAndStoreCoordinates();
  }, [initSocket, setBoundingBox, setNavigableWater, setPorts]);

  // This component renders absolutely nothing to the screen
  return null;
}
