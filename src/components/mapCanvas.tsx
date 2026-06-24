"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
// You can remove the leaflet css import from here if you put it in globals.css

// 1. Create a tiny helper component that forces Leaflet to recalculate its size
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

        {/* 2. Drop the helper component inside your MapContainer */}
        <MapFix />
      </MapContainer>
    </div>
  );
}
