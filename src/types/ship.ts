// 1. Match the exact Enum from the backend
export enum Status {
  NORMAL = "normal",
  REROUTING = "REROUTING",
  DISTRESSED = "DISTRESSED",
  STOPPED = "STOPPED",
  ARRIVED = "ARRIVED",
}

// 2. What the backend actually sends over the WebSocket
export interface BackendShipPayload {
  shipId: string;
  name: string;
  destination: string;
  position: { lat: number; long: number }; // Backend format
  speed: number;
  heading: number;
  fuel: number;
  cargo: string;
  status: Status;
  hasArrived: boolean | null;
  path?: [number, number][]; // Optional because of backend conditional spread
}

// 3. What your Zustand store and UI components use
export interface ShipConfig extends Omit<
  BackendShipPayload,
  "position" | "path"
> {
  position: [number, number]; // Leaflet format
  path?: [number, number][] | null;
}
