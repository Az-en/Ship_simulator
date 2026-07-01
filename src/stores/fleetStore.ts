import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { ShipConfig } from "@/types/ship";
interface FleetState {
  socket: Socket | null;
  fleetUpdates: ShipConfig[];
  isConnected: boolean;
  isConnectionFailed: boolean;
  initSocket: () => void;
  startSimulator: () => void;
}

export const useFleetStore = create<FleetState>((set, get) => ({
  isConnected: false,
  fleetUpdates: [],
  socket: null,
  isConnectionFailed: false,

  initSocket: () => {
    if (get().socket) return;

    const socket = io("http://localhost:4000", {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
      console.log("Socket Handshake successfull");
      set(() => ({ isConnected: true, isConnectionFailed: false }));
    });
    socket.on("disconnect", () => {
      console.log("Socket Handshake disconnected");
      set(() => ({ isConnected: false }));
    });
    socket.on("fleetUpdate", (data: any[]) => {
      set((state) => ({ fleetUpdates: { ...state.fleetUpdates, data } }));
    });

    socket.io.on("reconnect_attempt", (attempt: number) => {
      console.log(`Reconnection attempt #${attempt}...`);
    });

    // Fires ONLY when reconnectionAttempts (5) is completely exhausted
    socket.io.on("reconnect_failed", () => {
      console.error("Max reconnection attempts reached. Giving up.");
      set({ isConnectionFailed: true, isConnected: false });
    });

    set({ socket });
  },
  startSimulator: () => {
    const { socket, isConnected } = get();

    if (socket && isConnected) {
      socket.emit("startSimulator", {}, (res: any[]) => {
        console.log("Server acknowledged startSimulator:", res);
      });
    } else {
      console.error("Cannot start simulator: Socket is not connected");
    }
  },
}));
