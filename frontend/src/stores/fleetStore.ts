import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import { BackendShipPayload, ShipConfig, Status } from "@/types/ship";
import { toast } from "sonner";
import { DrawnPolygon } from "@/types/coordinates";
import { useAlertStore } from "./alertStore";
import { Alert } from "@/types/alert";

interface FleetState {
  socket: Socket | null;
  fleetUpdates: ShipConfig[];
  isConnected: boolean;
  isStarted: boolean;
  isConnectionFailed: boolean;
  selectedShipId: string | null;
  restrictedAreas: DrawnPolygon[];
  initSocket: () => void;
  startSimulator: () => void;
  stopSimulator: () => void;
  setSelectedShipId: (id: string | null) => void;
  addRestrictedArea: (coordinates: DrawnPolygon) => void;
}

export const useFleetStore = create<FleetState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      isStarted: false,
      fleetUpdates: [],
      socket: null,
      isConnectionFailed: false,
      selectedShipId: null,
      restrictedAreas: [],

      setSelectedShipId: (id) => set({ selectedShipId: id }),

      addRestrictedArea: (coordinates) =>
        set((state) => ({
          restrictedAreas: [...state.restrictedAreas, coordinates],
        })),

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

          // Fetch active alerts on connect
          socket.emit("getAlerts", {}, (res: { alerts?: Alert[] }) => {
            if (res?.alerts) {
              useAlertStore.getState().setAlerts(res.alerts);
            }
          });
        });

        socket.on("disconnect", () => {
          console.log("Socket Handshake disconnected");
          set(() => ({ isConnected: false }));
        });

        // Listen for individual alert updates
        socket.on("alert", (incomingAlert: Alert) => {
          useAlertStore.getState().addOrUpdateAlert(incomingAlert);
        });

        // Listen for active alerts list
        socket.on("alerts", (incomingAlerts: Alert[]) => {
          useAlertStore.getState().setAlerts(incomingAlerts);
        });

        socket.on("fleetUpdate", (newData: BackendShipPayload[]) => {
          set((state) => {
            const oldData = state.fleetUpdates;

            const merged = newData.map((incomingShip) => {
              const oldShip = oldData.find(
                (old) => old.shipId === incomingShip.shipId,
              );

              const normalizedPosition: [number, number] = [
                incomingShip.position.lat,
                incomingShip.position.long,
              ];

              const preservedPath =
                incomingShip.path !== undefined
                  ? incomingShip.path
                  : oldShip?.path;

              const rawStatus = incomingShip.status ?? Status.NORMAL;
              const normalizedStatus =
                rawStatus.toUpperCase() as unknown as Status;

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
        });

        socket.io.on("reconnect_attempt", (attempt: number) => {
          console.log(`Reconnection attempt #${attempt}...`);
        });

        socket.io.on("reconnect_failed", () => {
          toast.error("Max reconnection attempts reached. Giving up.");
          set({ isConnectionFailed: true, isConnected: false });
        });

        set({ socket });
      },

      startSimulator: () => {
        const { socket, isConnected } = get();
        if (socket && isConnected) {
          socket.emit("startSimulator", {}, () => {
            toast.success("Server acknowledged startSimulator");
          });
          set(() => ({ isStarted: true }));
        } else {
          toast.error("Cannot start simulator: Socket is not connected");
        }
      },
      stopSimulator: () => {
        const { socket, isConnected } = get();
        if (socket && isConnected) {
          socket.emit("stopSimulator", {}, () => {
            toast.success("Server acknowledged stopSimulator");
          });
          set(() => ({ isStarted: false }));
        } else {
          toast.error("Cannot stop simulator: Socket is not connected");
        }
      },
    }),
    {
      name: "fleet-storage",
      partialize: (state) => ({
        restrictedAreas: state.restrictedAreas,
      }),
    },
  ),
);
