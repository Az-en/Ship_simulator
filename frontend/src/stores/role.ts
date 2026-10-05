import { create } from "zustand";

export enum Role {
  COMMAND = "COMMAND",
  CAPTAIN = "CAPTAIN",
}

interface RoleState {
  role: Role | null;
  captainShipId: string | null;
  setCommand: () => void;
  setCaptain: (shipId?: string) => void;
  setCaptainShipId: (shipId: string | null) => void;
  clearRole: () => void;
}

// 3. Create the strictly-typed store
export const useRoleStore = create<RoleState>((set) => ({
  role: null,
  captainShipId: null,
  setCommand: () => set({ role: Role.COMMAND, captainShipId: null }),
  setCaptain: (shipId) =>
    set({ role: Role.CAPTAIN, captainShipId: shipId || "MV-1" }),
  setCaptainShipId: (shipId) => set({ captainShipId: shipId }),
  clearRole: () => set({ role: null, captainShipId: null }),
}));
