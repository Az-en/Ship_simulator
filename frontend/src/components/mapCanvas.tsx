"use client";

import React, { useEffect } from "react";
import * as L from "leaflet";
import {
  MapContainer,
  TileLayer,
  useMap,
  Polygon,
  CircleMarker,
  Tooltip,
  Marker,
  Polyline,
  FeatureGroup,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { useCoordinatesStore } from "@/stores/coordinatesStore";
import { useFleetStore } from "@/stores/fleetStore";
import { useRoleStore } from "@/stores/role";
import { DrawnPolygon } from "@/types/coordinates";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

interface DrawPolygonEvent {
  layerType: string;
  layer: L.Layer;
}

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

const createShipIcon = (isSelected: boolean, isFaded: boolean = false) =>
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
        opacity: ${isFaded ? "0.3" : "1"};
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

export default function MapCanvas() {
  // Navigation Environment State
  // const bb = useCoordinatesStore((state) => state.bb);
  const nWater = useCoordinatesStore((state) => state.navigableWater);
  const ports = useCoordinatesStore((state) => state.ports);

  // Role State
  const role = useRoleStore((state) => state.role);
  const captainShipId = useRoleStore((state) => state.captainShipId);

  // Fleet State
  const ships = useFleetStore((state) => state.fleetUpdates);
  const selectedShipId = useFleetStore((state) => state.selectedShipId);
  const setSelectedShipId = useFleetStore((state) => state.setSelectedShipId);
  const socket = useFleetStore((state) => state.socket);
  const addRestrictedArea = useFleetStore((state) => state.addRestrictedArea);
  const restrictedAreas = useFleetStore((state) => state.restrictedAreas);

  // Synchronize selection for captain's vessel
  useEffect(() => {
    if (
      role === "CAPTAIN" &&
      captainShipId &&
      selectedShipId !== captainShipId
    ) {
      setSelectedShipId(captainShipId);
    }
  }, [role, captainShipId, selectedShipId, setSelectedShipId]);
  const handleCreated = (e: DrawPolygonEvent) => {
    const { layerType, layer } = e;

    if (layerType === "polygon") {
      const polygonLayer = layer as L.Polygon;
      const rawCoordinates = polygonLayer.getLatLngs();
      socket?.emit("NewRestrictidArea", { coordinates: rawCoordinates });
      let normalizedPolygon: DrawnPolygon;
      if (
        Array.isArray(rawCoordinates[0]) &&
        Array.isArray((rawCoordinates as L.LatLng[][][])[0][0])
      ) {
        const multiPoly = rawCoordinates as L.LatLng[][][];
        normalizedPolygon = multiPoly[0].map((ring) =>
          ring.map((pt: L.LatLng) => ({ lat: pt.lat, lng: pt.lng })),
        );
      } else if (Array.isArray(rawCoordinates[0])) {
        const poly = rawCoordinates as L.LatLng[][];
        normalizedPolygon = poly.map((ring) =>
          ring.map((pt: L.LatLng) => ({ lat: pt.lat, lng: pt.lng })),
        );
      } else {
        const flatPoly = rawCoordinates as L.LatLng[];
        normalizedPolygon = [
          flatPoly.map((pt: L.LatLng) => ({ lat: pt.lat, lng: pt.lng })),
        ];
      }
      addRestrictedArea(normalizedPolygon);
    }
  };

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

        {restrictedAreas &&
          restrictedAreas.map((coords, index) => (
            <Polygon
              key={`restricted-${index}`}
              positions={coords as L.LatLngExpression[][]} // <-- Replaced "any" with native Leaflet type
              pathOptions={{
                color: "#97009c",
                fillColor: "#97009c",
                fillOpacity: 0.2,
                weight: 3,
              }}
            />
          ))}

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
          const isFaded = role === "CAPTAIN" && ship.shipId !== captainShipId;

          return (
            <React.Fragment key={ship.shipId}>
              {/* 1. The Ship Marker */}
              <Marker
                position={ship.position}
                icon={createShipIcon(isSelected, isFaded)}
                eventHandlers={{
                  click: () => {
                    if (!isFaded) {
                      setSelectedShipId(ship.shipId);
                    }
                  },
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

        {role === "COMMAND" && (
          <FeatureGroup>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              draw={{
                // Disable shapes you don't want the user to draw
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
                // Keep polygon enabled
                polygon: {
                  allowIntersection: false, // Prevent self-intersecting polygons
                  drawError: {
                    color: "#e1e100", // Color when the shape is invalid
                    message: "<strong>Error:</strong> shape edges cannot cross!",
                  },
                  shapeOptions: {
                    color: "#97009c", // Custom color for the drawn polygon
                  },
                },
              }}
            ></EditControl>
          </FeatureGroup>
        )}
      </MapContainer>
    </div>
  );
}
