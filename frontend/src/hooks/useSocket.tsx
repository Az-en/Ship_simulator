"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

type FleetData = any;

export function useFleetSocket(serverUrl: string = "http://localhost:4000") {
  const socketRef = useRef<Socket | null>(null);
  const [fleetUpdates, setFleetUpdates] = useState<FleetData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(serverUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connection handshake successful");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Listen to the 'fleetUpdate' event
    socket.on("fleetUpdate", (data: FleetData) => {
      console.log("New fleet update received:", data);
      setFleetUpdates((prev) => [...prev, data]);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [serverUrl]);

  // Wrapped in useCallback so it doesn't trigger unnecessary re-renders in components
  const startSimulator = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(
        "startSimulator",
        {
          /* optional payload */
        },
        (response: any) => {
          console.log("Server acknowledged startSimulator:", response);
          alert("Simulator started successfully!");
        },
      );
    } else {
      console.error("Socket is not connected");
    }
  }, []);

  return {
    fleetUpdates,
    isConnected,
    startSimulator,
  };
}
