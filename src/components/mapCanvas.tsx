"use client";
import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";

export default function MapCanvas() {
  return (
    <div className="h-full w-full">
      <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
          subdomains="abcd"
        ></TileLayer>
      </MapContainer>
    </div>
  );
}
