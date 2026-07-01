"use client";

import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Rectangle,
  Polygon,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
import { useCoordinatesStore } from "@/stores/coordinatesStore";
function MapFix() {
  const map = useMap();

  useEffect(() => {
    // A tiny delay ensures Tailwind has finished expanding the layout
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export default function MapCanvas() {
  const bb = useCoordinatesStore((state) => state.bb);
  const nWater = useCoordinatesStore((state) => state.navigableWater);
  const ports = useCoordinatesStore((state) => state.ports);

  // Safely calculate Bounding Box bounds (ensure data exists before parsing)
  // Leaflet bounds format: [[south, west], [north, east]]
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

        {/* 2. Draw Bounding Box (Red dashed outline) */}
        {/* {bounds && (
          <Rectangle
            bounds={bounds}
            pathOptions={{
              color: "#ef4444",
              weight: 2,
              dashArray: "5, 10",
              fillOpacity: 0,
            }}
          />
        )} */}

        {/* 3. Draw Navigable Water Polygon (Translucent Blue) */}
        {nWater && nWater.length > 0 && (
          <>
            {/* A. The Translucent Blue Polygon */}
            <Polygon
              positions={nWater}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.2,
                weight: 1,
              }}
            />

            {/* B. The Individual Polygon Points */}
            {nWater.map((point, index) => (
              <CircleMarker
                // Using index is usually frowned upon, but for static map shapes it's perfectly fine.
                // Alternatively, use `${point[0]}-${point[1]}` as the key.
                key={`water-pt-${index}`}
                center={point as [number, number]}
                radius={3} // Keep these smaller than your ports so the map doesn't look cluttered
                pathOptions={{
                  color: "#60a5fa", // A slightly lighter blue for the dots
                  fillColor: "#60a5fa",
                  fillOpacity: 1,
                  weight: 1,
                }}
              >
                {/* Optional: A tiny tooltip to see the exact coordinates if you hover */}
                <Tooltip direction="top" offset={[0, -5]} opacity={0.8}>
                  <span className="text-xs font-mono text-gray-800">
                    {point[0]}, {point[1]}
                  </span>
                </Tooltip>
              </CircleMarker>
            ))}
          </>
        )}
        {/* 4. Draw Ports (Solid Emerald Dots with Tooltips) */}
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
            {/* Tooltip shows up when you hover over the port */}
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <span className="font-bold">{port.name}</span>
              <span className="font-bold">{port.position}</span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
