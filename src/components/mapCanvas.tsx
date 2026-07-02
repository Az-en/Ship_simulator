"use client";

import React, { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  useMap,
  Polygon,
  CircleMarker,
  Tooltip,
  Marker,
  Polyline,
} from "react-leaflet";
import { useCoordinatesStore } from "@/stores/coordinatesStore";
import { useFleetStore } from "@/stores/fleetStore"; // Import your fleet store

function MapFix() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// A simple fallback icon for your ships (a yellow circle with a border)
const createShipIcon = (isSelected: boolean) =>
  L.divIcon({
    className: "clear-background",
    html: `
      <div style="
        width: 16px; 
        height: 16px; 
        background-color: ${isSelected ? "#eab308" : "#f8fafc"}; /* Yellow if selected, white if not */
        border: 3px solid ${isSelected ? "#ca8a04" : "#64748b"}; 
        border-radius: 50%;
        box-shadow: 0 0 4px rgba(0,0,0,0.5);
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

export default function MapCanvas() {
  // Navigation Environment State
  const bb = useCoordinatesStore((state) => state.bb);
  const nWater = useCoordinatesStore((state) => state.navigableWater);
  const ports = useCoordinatesStore((state) => state.ports);

  // Fleet State
  const ships = useFleetStore((state) => state.fleetUpdates);
  const selectedShipId = useFleetStore((state) => state.selectedShipId);
  const setSelectedShipId = useFleetStore((state) => state.setSelectedShipId);

  const hasBoundingBox = bb && bb.north !== "";
  const bounds: [[number, number], [number, number]] | undefined =
    hasBoundingBox
      ? [
          [parseFloat(bb.south), parseFloat(bb.west)],
          [parseFloat(bb.north), parseFloat(bb.east)],
        ]
      : undefined;

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[25.5, 54.5]}
        zoom={6}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
          subdomains="abcd"
        />
        <MapFix />

        {/* --- Map Environment Data (Water & Ports) --- */}
        {nWater && nWater.length > 0 && (
          <>
            <Polygon
              positions={nWater}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.2,
                weight: 1,
              }}
            />
            {/* {nWater.map((point, index) => (
              <CircleMarker
                key={`water-pt-${index}`}
                center={point as [number, number]}
                radius={3}
                pathOptions={{
                  color: "#60a5fa",
                  fillColor: "#60a5fa",
                  fillOpacity: 1,
                  weight: 1,
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.8}>
                  <span className="text-xs font-mono text-gray-800">
                    {point[0]}, {point[1]}
                  </span>
                </Tooltip>
              </CircleMarker>
            ))} */}
          </>
        )}

        {ports?.map((port) => (
          <CircleMarker
            key={port.id}
            center={port.position}
            radius={6}
            pathOptions={{
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <span className="font-bold">{port.name}</span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* --- Fleet Rendering --- */}
        {ships.map((ship) => {
          const isSelected = ship.shipId === selectedShipId;

          return (
            <React.Fragment key={ship.shipId}>
              {/* 1. The Ship Marker */}
              <Marker
                position={ship.position}
                icon={createShipIcon(isSelected)}
                eventHandlers={{
                  click: () => setSelectedShipId(ship.shipId), // Update global selection on click
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <div className="font-bold">{ship.name}</div>
                  <div className="text-xs text-slate-500">{ship.speed} kn</div>
                </Tooltip>
              </Marker>

              {/* 2. The Animated Path (Only shown if this ship is selected AND has a path) */}
              {isSelected && ship.path && ship.path.length > 0 && (
                <Polyline
                  positions={ship.path}
                  pathOptions={{
                    color: "#06b6d4", // Cyan color for the path
                    weight: 3,
                    className: "animated-ship-path", // Triggers the CSS animation
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
