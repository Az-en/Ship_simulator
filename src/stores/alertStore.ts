import { create } from "zustand";
import { Alert, AlertStatus, AlertType } from "@/types/alert";
import { toast } from "sonner";
import { useFleetStore } from "./fleetStore";

interface AlertState {
  alerts: Alert[];
  alertHistory: Alert[];

  // Actions
  setAlerts: (alerts: Alert[]) => void;
  addOrUpdateAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  clearResolvedAlerts: () => void;
}

export const useAlertStore = create<AlertState>()((set, get) => ({
  alerts: [],
  alertHistory: [],

  setAlerts: (incomingAlerts: Alert[]) => {
    const active = incomingAlerts.filter(
      (a) =>
        a.status === AlertStatus.ACTIVE ||
        a.status === AlertStatus.ACKNOWLEDGED ||
        a.status === "ACTIVE" ||
        a.status === "ACKNOWLEDGED",
    );
    const resolved = incomingAlerts.filter(
      (a) => a.status === AlertStatus.RESOLVED || a.status === "RESOLVED",
    );

    set((state) => ({
      alerts: active,
      alertHistory: [
        ...resolved,
        ...state.alertHistory.filter(
          (h) => !resolved.some((r) => r.id === h.id),
        ),
      ],
    }));
  },

  addOrUpdateAlert: (alert: Alert) => {
    const isResolved =
      alert.status === AlertStatus.RESOLVED || alert.status === "RESOLVED";

    if (isResolved) {
      set((state) => ({
        alerts: state.alerts.filter((a) => a.id !== alert.id),
        alertHistory: [
          alert,
          ...state.alertHistory.filter((h) => h.id !== alert.id),
        ],
      }));
      return;
    }

    set((state) => {
      const existingIndex = state.alerts.findIndex((a) => a.id === alert.id);

      if (existingIndex >= 0) {
        // In-place update (e.g. proximity distance change or status update)
        const updated = [...state.alerts];
        updated[existingIndex] = alert;
        return { alerts: updated };
      }

      // New incoming alert: trigger desktop toast notification
      if (
        alert.severity === "CRITICAL" ||
        alert.type === AlertType.GEOFENCE_BREACH
      ) {
        toast.error(alert.message, {
          description: `Ship: ${alert.shipId || alert.shipName || "Unknown"} | Zone: ${alert.zoneName || ""}`,
        });
      } else {
        toast.warning(alert.message, {
          description: alert.shipIds
            ? `Ships: ${alert.shipIds.join(" & ")}`
            : undefined,
        });
      }

      return {
        alerts: [alert, ...state.alerts],
      };
    });
  },

  acknowledgeAlert: (alertId: string) => {
    // Send acknowledgement to backend if socket connected
    const socket = useFleetStore.getState().socket;
    if (socket) {
      socket.emit(
        "acknowledgeAlert",
        { alertId },
        (res: { alert?: Alert; status?: string }) => {
          if (res?.alert) {
            get().addOrUpdateAlert(res.alert);
          }
        },
      );
    }

    // Optimistic local state update
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: AlertStatus.ACKNOWLEDGED,
              acknowledgedAt: new Date().toISOString(),
            }
          : a,
      ),
    }));
  },

  resolveAlert: (alertId: string) => {
    // Send resolution to backend if socket connected
    const socket = useFleetStore.getState().socket;
    if (socket) {
      socket.emit(
        "resolveAlert",
        { alertId },
        (res: { alert?: Alert; status?: string }) => {
          if (res?.alert) {
            get().addOrUpdateAlert(res.alert);
          }
        },
      );
    }

    // Optimistic local state update: move to resolved history
    set((state) => {
      const alert = state.alerts.find((a) => a.id === alertId);
      if (!alert) return state;

      const resolvedAlert = {
        ...alert,
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date().toISOString(),
      };

      return {
        alerts: state.alerts.filter((a) => a.id !== alertId),
        alertHistory: [
          resolvedAlert,
          ...state.alertHistory.filter((h) => h.id !== alertId),
        ],
      };
    });
  },

  clearResolvedAlerts: () => set({ alertHistory: [] }),
}));
