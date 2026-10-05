"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAlertStore } from "@/stores/alertStore";
import { useFleetStore } from "@/stores/fleetStore";
import { AlertStatus, AlertType, Alert } from "@/types/alert";
import {
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Check,
  X,
  Radio,
} from "lucide-react";

function formatTimestamp(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
  } catch {
    // ignore
  }
  return isoString;
}

export default function AlertsPanel() {
  const alerts = useAlertStore((state) => state.alerts);
  const acknowledgeAlert = useAlertStore((state) => state.acknowledgeAlert);
  const resolveAlert = useAlertStore((state) => state.resolveAlert);

  const selectedShipId = useFleetStore((state) => state.selectedShipId);
  const setSelectedShipId = useFleetStore((state) => state.setSelectedShipId);

  // --- RESIZE LOGIC ---
  const [panelHeight, setPanelHeight] = useState(176); // 176px equals Tailwind h-44
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = panelHeight;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none"; // Prevent text selection while dragging
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    // Calculate the difference in Y (moving mouse UP means larger height)
    const deltaY = startY.current - e.clientY;

    // Constrain height between 100px and 80% of window height
    const maxHeight = window.innerHeight * 0.8;
    const newHeight = Math.max(100, Math.min(startHeight.current + deltaY, maxHeight));

    setPanelHeight(newHeight);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  // --------------------

  // Filter into Geofence breaches vs Proximity / Emergency alerts
  const geofenceAlerts = alerts.filter(
    (a) =>
      a.type === AlertType.GEOFENCE_BREACH ||
      a.type === "GEOFENCE_BREACH" ||
      (!!a.zoneName && a.type !== AlertType.PROXIMITY_WARNING),
  );

  const emergencyAlerts = alerts.filter(
    (a) =>
      a.type === AlertType.PROXIMITY_WARNING ||
      a.type === "PROXIMITY_WARNING" ||
      (!geofenceAlerts.includes(a) && a.severity === "CRITICAL"),
  );

  return (
    <div
      style={{ height: `${panelHeight}px` }}
      className="w-full relative flex flex-col bg-gray-950/90 backdrop-blur border-t border-gray-800 shrink-0"
    >
      {/* DRAG HANDLE */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 left-0 w-full h-3 cursor-row-resize flex items-center justify-center hover:bg-white/5 transition-colors z-50 group"
      >
        {/* Visual indicator (pill) */}
        <div className="w-12 h-1 rounded-full bg-gray-700 group-hover:bg-gray-400 transition-colors" />
      </div>

      {/* CONTENT GRID */}
      {/* pt-4 accounts for the space taken by the absolute drag handle */}
      <div className="flex-1 p-3 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">

        {/* SECTION 1: Geofence Alerts */}
        <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-3 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-800/50 shrink-0">
            <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              Geofence Alerts
            </h3>
            <span
              className={`px-1.5 py-0.2 text-[10px] font-mono rounded border ${geofenceAlerts.length > 0
                  ? "bg-amber-950/60 border-amber-800/80 text-amber-400 animate-pulse"
                  : "bg-gray-900 border-gray-800 text-gray-500"
                }`}
            >
              {geofenceAlerts.length} Active
            </span>
          </div>

          <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
            {geofenceAlerts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-600 font-mono text-xs">
                NO ACTIVE GEOFENCE BREACHES
              </div>
            ) : (
              geofenceAlerts.map((alert) => {
                const isSelected =
                  !!alert.shipId && alert.shipId === selectedShipId;
                const isAcknowledged =
                  alert.status === AlertStatus.ACKNOWLEDGED ||
                  alert.status === "ACKNOWLEDGED";

                return (
                  <div
                    key={alert.id}
                    onClick={() => alert.shipId && setSelectedShipId(alert.shipId)}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer group border ${isSelected
                        ? "bg-amber-950/30 border-amber-600/80 ring-1 ring-amber-500/50"
                        : "bg-gray-900/40 border-gray-800/60 hover:border-gray-700/80"
                      }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-[10px] font-mono font-bold text-amber-300 shrink-0">
                        {alert.shipId || "VESSEL"}
                      </span>
                      {alert.zoneName && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-800/80 text-[10px] font-mono text-gray-400 shrink-0 truncate max-w-[120px]">
                          {alert.zoneName}
                        </span>
                      )}
                      <p className="text-xs text-slate-300 truncate font-medium">
                        {alert.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] font-mono text-gray-500">
                        {formatTimestamp(alert.timestamp)}
                      </span>

                      {/* Status badge & Quick Actions */}
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isAcknowledged ? (
                          <button
                            type="button"
                            title="Acknowledge Alert"
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-mono flex items-center gap-1 border border-amber-500/40 transition-colors"
                          >
                            <Check className="h-2.5 w-2.5" /> Ack
                          </button>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px] font-mono">
                            Ack'd
                          </span>
                        )}

                        <button
                          type="button"
                          title="Resolve Alert"
                          onClick={() => resolveAlert(alert.id)}
                          className="p-1 rounded bg-gray-800/60 hover:bg-rose-950/60 hover:text-rose-300 text-gray-400 border border-gray-700/60 hover:border-rose-800/60 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      <ChevronRight className="h-3 w-3 text-gray-600 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION 2: Emergency & Proximity Alerts */}
        <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-3 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
              <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                Emergency & Proximity Alerts
              </h3>
            </div>
            <span
              className={`px-1.5 py-0.2 text-[10px] font-mono rounded border ${emergencyAlerts.length > 0
                  ? "bg-rose-950/60 border-rose-800/80 text-rose-400 animate-pulse"
                  : "bg-gray-900 border-gray-800 text-gray-500"
                }`}
            >
              {emergencyAlerts.length} Active
            </span>
          </div>

          <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
            {emergencyAlerts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-600 font-mono text-xs">
                ALL SYSTEMS NOMINAL
              </div>
            ) : (
              emergencyAlerts.map((alert) => {
                const targetShipId =
                  alert.shipId || alert.ship1Id || alert.shipIds?.[0];
                const isSelected =
                  !!targetShipId && targetShipId === selectedShipId;
                const isAcknowledged =
                  alert.status === AlertStatus.ACKNOWLEDGED ||
                  alert.status === "ACKNOWLEDGED";

                const shipLabel = alert.shipIds
                  ? alert.shipIds.join(" ↔ ")
                  : alert.shipId || "FLEET";

                const distance = alert.distance ?? alert.distanceKm;

                return (
                  <div
                    key={alert.id}
                    onClick={() => targetShipId && setSelectedShipId(targetShipId)}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer group border ${isSelected
                        ? "bg-rose-950/40 border-rose-600/80 ring-1 ring-rose-500/50"
                        : "bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60"
                      }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-rose-900/60 border border-rose-700/60 text-[10px] font-mono font-bold text-rose-200 shrink-0">
                        {shipLabel}
                      </span>
                      {distance !== undefined && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/60 text-[10px] font-mono text-rose-300 flex items-center gap-1 shrink-0">
                          <Radio className="h-2.5 w-2.5 text-rose-400 animate-ping" />
                          {distance} km
                        </span>
                      )}
                      <p className="text-xs text-rose-200 truncate font-medium">
                        {alert.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] font-mono text-rose-400/70">
                        {formatTimestamp(alert.timestamp)}
                      </span>

                      {/* Quick Actions */}
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isAcknowledged ? (
                          <button
                            type="button"
                            title="Acknowledge Alert"
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-mono flex items-center gap-1 border border-rose-500/40 transition-colors"
                          >
                            <Check className="h-2.5 w-2.5" /> Ack
                          </button>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px] font-mono">
                            Ack'd
                          </span>
                        )}

                        <button
                          type="button"
                          title="Resolve Alert"
                          onClick={() => resolveAlert(alert.id)}
                          className="p-1 rounded bg-gray-800/60 hover:bg-rose-950/60 hover:text-rose-300 text-gray-400 border border-gray-700/60 hover:border-rose-800/60 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      <ChevronRight className="h-3 w-3 text-rose-500 group-hover:text-rose-300 transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}