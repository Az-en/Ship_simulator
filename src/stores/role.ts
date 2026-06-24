import { create } from "zustand";

enum Role {
  COMMAND = "COMMAND",
  CAPTAIN = "CAPTAIN",
}

export const useRoleStore = create((set) => ({
  role: "",
  setCommand: () => set(() => ({ role: Role.COMMAND })),
  setCaptain: () => set(() => ({ role: Role.CAPTAIN })),
}));
