enum Status {
  NORMAL = "normal",
  REROUTING = "REROUTING",
  DISTRESSED = "DISTRESSED",
  STOPPED = "STOPPED",
  ARRIVED = "ARRIVED",
}

export interface ShipConfig {
  shipId: string;
  name: string;
  destination: string;
  position: [number, number];
  speed: number;
  heading: number;
  fuel: number;
  cargo: string;
  status?: Status;
  hasArrived?: boolean | null;
  path?: [number, number][] | null;
  hasPathChanged: boolean;
}
