export enum AlertType {
  GEOFENCE_BREACH = "GEOFENCE_BREACH",
  PROXIMITY_WARNING = "PROXIMITY_WARNING",
}

export enum AlertSeverity {
  CRITICAL = "CRITICAL",
  WARNING = "WARNING",
  INFO = "INFO",
}

export enum AlertStatus {
  ACTIVE = "ACTIVE",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  RESOLVED = "RESOLVED",
}

export interface Alert {
  id: string;
  type: AlertType | string;
  severity: AlertSeverity | string;
  status: AlertStatus | string;
  message: string;
  timestamp: string;
  shipId?: string;
  shipName?: string;
  shipIds?: string[];
  ship1Id?: string;
  ship2Id?: string;
  zoneId?: string;
  zoneName?: string;
  distance?: number;
  distanceKm?: number;
  acknowledgedAt?: string;
  resolvedAt?: string;
}
