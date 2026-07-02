import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { BackendShipPayload, ShipConfig, Status } from "@/types/ship";
import { toast } from "sonner";

interface FleetState {
  socket: Socket | null;
  fleetUpdates: ShipConfig[];
  isConnected: boolean;
  isConnectionFailed: boolean;
  initSocket: () => void;
  startSimulator: () => void;
  selectedShipId: string | null;
  setSelectedShipId: (id: string | null) => void;
}

export const useFleetStore = create<FleetState>((set, get) => ({
  isConnected: false,
  fleetUpdates: [],
  socket: null,
  isConnectionFailed: false,
  selectedShipId: null,

  setSelectedShipId: (id) => set({ selectedShipId: id }),

  initSocket: () => {
    if (get().socket) return;

    const socket = io("http://localhost:4000", {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
      console.log("Socket Handshake successful");
      set(() => ({ isConnected: true, isConnectionFailed: false }));
    });

    socket.on("disconnect", () => {
      console.log("Socket Handshake disconnected");
      set(() => ({ isConnected: false }));
    });

    socket.on("fleetUpdate", (newData: BackendShipPayload[]) => {
      set((state) => {
        const oldData = state.fleetUpdates;

        const merged = newData.map((incomingShip) => {
          const oldShip = oldData.find(
            (old) => old.shipId === incomingShip.shipId,
          );

          // 1. NORMALIZE POSITION: {lat, long} -> [lat, lng]
          const normalizedPosition: [number, number] = [
            incomingShip.position.lat,
            incomingShip.position.long,
          ];

          // 2. PRESERVE PATH
          const preservedPath =
            incomingShip.path !== undefined ? incomingShip.path : oldShip?.path;

          // 3. NORMALIZE STATUS
          const rawStatus = incomingShip.status ?? Status.NORMAL;
          const normalizedStatus = rawStatus.toUpperCase() as unknown as Status;

          return {
            ...oldShip,
            ...incomingShip,
            position: normalizedPosition,
            path: preservedPath,
            status: normalizedStatus,
          } as ShipConfig;
        });

        return { fleetUpdates: merged };
      });
    }); // <--- THIS WAS MISSING! Closes the fleetUpdate listener.

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
      socket.emit("startSimulator", {}, (res: ShipConfig[]) => {
        toast.success("Server acknowledged startSimulator");
      });
    } else {
      toast.error("Cannot start simulator: Socket is not connected");
    }
  },
}));
