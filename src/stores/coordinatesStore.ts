import { create } from "zustand";
import * as coorTypes from "@/types/coordinates";

interface CoordinatesStore {
  bb: coorTypes.boundingBox;
  navigableWater: coorTypes.navigableWater;
  ports: coorTypes.Port[];

  setBoundingBox: (bb: coorTypes.boundingBox) => void;
  setNavigableWater: (water: coorTypes.navigableWater) => void;
  setPorts: (ports: coorTypes.Port[]) => void;
}

export const useCoordinatesStore = create<CoordinatesStore>((set) => ({
  bb: {
    north: "",
    south: "",
    east: "",
    west: "",
  },
  navigableWater: [],
  ports: [],

  setBoundingBox: (bb) => set({ bb }),
  setNavigableWater: (navigableWater) => set({ navigableWater }),
  setPorts: (ports) => set({ ports }),
}));
