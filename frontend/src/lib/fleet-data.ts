// Strait of Hormuz operational dataset (static sample data for layout phase)

export const BBOX = {
  north: 30.5,
  south: 22.0,
  east: 60.0,
  west: 47.5,
} as const;

export type ShipStatus =
  | "normal"
  | "arrived"
  | "rerouting"
  | "distressed"
  | "stopped"
  | "stranded"
  | "insufficient_fuel";

export type CargoType =
  | "Crude Oil"
  | "LNG"
  | "Container"
  | "Bulk Grain"
  | "Chemical"
  | "Vehicle"
  | "Refined Fuel";

export interface Port {
  code: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export interface Ship {
  id: string;
  name: string;
  lat: number;
  lng: number;
  speed: number; // knots
  heading: number; // 0-360 degrees
  destination: string; // port code
  fuel: number; // tons
  fuelCapacity: number; // tons
  cargo: CargoType;
  status: ShipStatus;
}

export type AlertSeverity = "critical" | "warning" | "info";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: string;
  shipId?: string;
  message: string;
  timestamp: string;
}

export interface RestrictedZone {
  id: string;
  name: string;
  type: "exclusion" | "caution" | "transit";
  coordinates: [number, number][];
}

export const PORTS: Port[] = [
  {
    code: "BND",
    name: "Bandar Abbas",
    country: "Iran",
    lat: 27.18,
    lng: 56.27,
  },
  { code: "JEA", name: "Jebel Ali", country: "UAE", lat: 25.01, lng: 55.06 },
  { code: "FJR", name: "Fujairah", country: "UAE", lat: 25.12, lng: 56.33 },
  { code: "KHS", name: "Khasab", country: "Oman", lat: 26.18, lng: 56.24 },
  {
    code: "LNG",
    name: "Bandar Lengeh",
    country: "Iran",
    lat: 26.55,
    lng: 54.88,
  },
  { code: "QSM", name: "Qeshm", country: "Iran", lat: 26.95, lng: 56.27 },
  { code: "SOH", name: "Sohar", country: "Oman", lat: 24.47, lng: 56.63 },
  { code: "SHJ", name: "Sharjah", country: "UAE", lat: 25.36, lng: 55.39 },
  { code: "AUH", name: "Abu Dhabi", country: "UAE", lat: 24.47, lng: 54.37 },
  { code: "DOH", name: "Doha", country: "Qatar", lat: 25.29, lng: 51.53 },
  {
    code: "DMM",
    name: "Dammam",
    country: "Saudi Arabia",
    lat: 26.43,
    lng: 50.1,
  },
  { code: "BAH", name: "Manama", country: "Bahrain", lat: 26.21, lng: 50.58 },
  {
    code: "KWI",
    name: "Kuwait City",
    country: "Kuwait",
    lat: 29.37,
    lng: 47.97,
  },
  { code: "BUZ", name: "Bushehr", country: "Iran", lat: 28.97, lng: 50.84 },
  {
    code: "RTA",
    name: "Ras Tanura",
    country: "Saudi Arabia",
    lat: 26.64,
    lng: 50.16,
  },
];

export const SHIPS: Ship[] = [
  {
    id: "IMO-9012345",
    name: "Persian Pearl",
    lat: 26.62,
    lng: 56.45,
    speed: 14.2,
    heading: 295,
    destination: "JEA",
    fuel: 1820,
    fuelCapacity: 2400,
    cargo: "Crude Oil",
    status: "normal",
  },
  {
    id: "IMO-9023456",
    name: "Gulf Sovereign",
    lat: 26.35,
    lng: 55.7,
    speed: 11.8,
    heading: 250,
    destination: "AUH",
    fuel: 940,
    fuelCapacity: 2000,
    cargo: "LNG",
    status: "normal",
  },
  {
    id: "IMO-9034567",
    name: "Hormuz Voyager",
    lat: 26.05,
    lng: 56.5,
    speed: 0,
    heading: 110,
    destination: "FJR",
    fuel: 60,
    fuelCapacity: 1800,
    cargo: "Container",
    status: "insufficient_fuel",
  },
  {
    id: "IMO-9045678",
    name: "Arabian Crest",
    lat: 25.55,
    lng: 54.6,
    speed: 16.4,
    heading: 305,
    destination: "JEA",
    fuel: 1320,
    fuelCapacity: 2200,
    cargo: "Refined Fuel",
    status: "rerouting",
  },
  {
    id: "IMO-9056789",
    name: "Desert Falcon",
    lat: 25.0,
    lng: 55.05,
    speed: 0,
    heading: 90,
    destination: "JEA",
    fuel: 1500,
    fuelCapacity: 2000,
    cargo: "Vehicle",
    status: "arrived",
  },
  {
    id: "IMO-9067890",
    name: "Northern Tide",
    lat: 27.4,
    lng: 55.0,
    speed: 9.1,
    heading: 320,
    destination: "LNG",
    fuel: 410,
    fuelCapacity: 1600,
    cargo: "Bulk Grain",
    status: "distressed",
  },
  {
    id: "IMO-9078901",
    name: "Qatar Mariner",
    lat: 25.6,
    lng: 52.4,
    speed: 13.0,
    heading: 280,
    destination: "DOH",
    fuel: 1100,
    fuelCapacity: 2000,
    cargo: "LNG",
    status: "normal",
  },
  {
    id: "IMO-9089012",
    name: "Eastern Glory",
    lat: 26.5,
    lng: 53.5,
    speed: 0,
    heading: 200,
    destination: "BAH",
    fuel: 720,
    fuelCapacity: 1900,
    cargo: "Chemical",
    status: "stopped",
  },
  {
    id: "IMO-9090123",
    name: "Silver Horizon",
    lat: 27.0,
    lng: 51.5,
    speed: 12.6,
    heading: 330,
    destination: "BUZ",
    fuel: 1280,
    fuelCapacity: 2100,
    cargo: "Crude Oil",
    status: "normal",
  },
  {
    id: "IMO-9101234",
    name: "Bahri Star",
    lat: 26.3,
    lng: 50.7,
    speed: 7.4,
    heading: 15,
    destination: "RTA",
    fuel: 880,
    fuelCapacity: 1800,
    cargo: "Refined Fuel",
    status: "normal",
  },
  {
    id: "IMO-9112345",
    name: "Kuwait Lion",
    lat: 28.8,
    lng: 49.5,
    speed: 15.1,
    heading: 340,
    destination: "KWI",
    fuel: 1640,
    fuelCapacity: 2300,
    cargo: "Crude Oil",
    status: "normal",
  },
  {
    id: "IMO-9123456",
    name: "Oman Sentinel",
    lat: 24.7,
    lng: 56.2,
    speed: 0,
    heading: 130,
    destination: "SOH",
    fuel: 0,
    fuelCapacity: 1700,
    cargo: "Container",
    status: "stranded",
  },
  {
    id: "IMO-9134567",
    name: "Crescent Dawn",
    lat: 25.9,
    lng: 56.1,
    speed: 18.2,
    heading: 285,
    destination: "QSM",
    fuel: 1990,
    fuelCapacity: 2400,
    cargo: "LNG",
    status: "rerouting",
  },
  {
    id: "IMO-9145678",
    name: "Trucial Wind",
    lat: 25.2,
    lng: 55.7,
    speed: 10.5,
    heading: 270,
    destination: "SHJ",
    fuel: 760,
    fuelCapacity: 1600,
    cargo: "Bulk Grain",
    status: "normal",
  },
  {
    id: "IMO-9156789",
    name: "Gulf Pioneer",
    lat: 27.6,
    lng: 56.6,
    speed: 6.8,
    heading: 240,
    destination: "BND",
    fuel: 320,
    fuelCapacity: 1500,
    cargo: "Chemical",
    status: "distressed",
  },
];

// Approximate navigable water reference polygon across the Gulf and Strait
export const NAVIGABLE_WATER: [number, number][] = [
  [30.2, 48.4],
  [29.9, 50.0],
  [28.6, 50.2],
  [27.6, 51.0],
  [26.7, 51.9],
  [25.6, 51.2],
  [25.0, 52.6],
  [24.3, 53.8],
  [24.1, 54.6],
  [24.4, 55.2],
  [24.6, 56.0],
  [25.2, 56.6],
  [26.1, 56.9],
  [26.9, 57.0],
  [27.6, 56.9],
  [28.0, 56.2],
  [27.9, 55.0],
  [28.6, 53.6],
  [29.4, 51.8],
  [30.1, 50.2],
  [30.4, 48.8],
];

export const RESTRICTED_ZONES: RestrictedZone[] = [
  {
    id: "ZONE-A",
    name: "Hormuz Exclusion Alpha",
    type: "exclusion",
    coordinates: [
      [26.7, 56.2],
      [26.7, 56.7],
      [26.2, 56.8],
      [26.0, 56.4],
      [26.3, 56.1],
    ],
  },
  {
    id: "ZONE-B",
    name: "Central Caution Sector",
    type: "caution",
    coordinates: [
      [26.0, 54.0],
      [26.0, 54.8],
      [25.4, 54.9],
      [25.4, 54.1],
    ],
  },
  {
    id: "ZONE-C",
    name: "Northern Transit Corridor",
    type: "transit",
    coordinates: [
      [29.2, 49.6],
      [29.2, 50.4],
      [28.4, 50.5],
      [28.4, 49.7],
    ],
  },
];

export const ALERTS: Alert[] = [
  {
    id: "ALT-001",
    severity: "critical",
    type: "Distress Escalation",
    shipId: "IMO-9067890",
    message: "Northern Tide broadcasting Mayday — engine failure reported.",
    timestamp: "14:32:08Z",
  },
  {
    id: "ALT-002",
    severity: "critical",
    type: "Vessel Stranded",
    shipId: "IMO-9123456",
    message: "Oman Sentinel grounded near Sohar approach. Fuel depleted.",
    timestamp: "14:28:51Z",
  },
  {
    id: "ALT-003",
    severity: "warning",
    type: "Geofence Breach",
    shipId: "IMO-9134567",
    message: "Crescent Dawn entered Hormuz Exclusion Alpha.",
    timestamp: "14:21:33Z",
  },
  {
    id: "ALT-004",
    severity: "warning",
    type: "Low Fuel",
    shipId: "IMO-9034567",
    message: "Hormuz Voyager fuel below 5% threshold.",
    timestamp: "14:18:02Z",
  },
  {
    id: "ALT-005",
    severity: "warning",
    type: "Proximity Warning",
    shipId: "IMO-9156789",
    message: "Gulf Pioneer within 0.5nm of restricted boundary.",
    timestamp: "14:09:47Z",
  },
  {
    id: "ALT-006",
    severity: "info",
    type: "Status Change",
    shipId: "IMO-9056789",
    message: "Desert Falcon arrived at Jebel Ali.",
    timestamp: "13:58:19Z",
  },
  {
    id: "ALT-007",
    severity: "info",
    type: "Reroute Issued",
    shipId: "IMO-9045678",
    message: "Arabian Crest accepted new routing directive.",
    timestamp: "13:50:04Z",
  },
];

export const STATUS_META: Record<
  ShipStatus,
  { label: string; color: string; severity: "ok" | "warn" | "crit" | "info" }
> = {
  normal: { label: "Normal", color: "var(--status-normal)", severity: "ok" },
  arrived: { label: "Arrived", color: "var(--status-info)", severity: "info" },
  rerouting: {
    label: "Rerouting",
    color: "var(--status-info)",
    severity: "info",
  },
  distressed: {
    label: "Distressed",
    color: "var(--status-critical)",
    severity: "crit",
  },
  stopped: {
    label: "Stopped",
    color: "var(--status-warning)",
    severity: "warn",
  },
  stranded: {
    label: "Stranded",
    color: "var(--status-critical)",
    severity: "crit",
  },
  insufficient_fuel: {
    label: "Low Fuel",
    color: "var(--status-warning)",
    severity: "warn",
  },
};

export function portByCode(code: string): Port | undefined {
  return PORTS.find((p) => p.code === code);
}
