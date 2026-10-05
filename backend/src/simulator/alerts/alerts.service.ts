import { Injectable, Logger } from '@nestjs/common';
import { BehaviorSubject, Subject } from 'rxjs';
import { Alert, AlertSeverity, AlertStatus, AlertType } from './alert.model';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  // In-memory alert store
  private readonly alerts = new Map<string, Alert>();

  // RxJS subjects for live streaming
  public readonly alert$ = new Subject<Alert>();
  public readonly activeAlerts$ = new BehaviorSubject<Alert[]>([]);

  // Track active breaches to avoid duplicate alert spamming
  private readonly activeGeofenceBreaches = new Map<string, string>(); // `${shipId}_${zoneId}` -> alertId
  private readonly activeProximityBreaches = new Map<string, string>(); // `${s1}_${s2}` -> alertId

  /**
   * Dispatches or maintains a geofence breach alert
   */
  dispatchGeofenceBreach(
    shipId: string,
    shipName: string,
    zoneId: string,
    zoneName: string,
  ): Alert {
    const key = `${shipId}_${zoneId}`;

    if (this.activeGeofenceBreaches.has(key)) {
      const existingId = this.activeGeofenceBreaches.get(key)!;
      const existingAlert = this.alerts.get(existingId);
      if (existingAlert && existingAlert.status !== AlertStatus.RESOLVED) {
        return existingAlert;
      }
    }

    const now = new Date().toISOString();
    const id = `alert-geo-${shipId}-${zoneId}-${Date.now()}`;
    const alert: Alert = {
      id,
      type: AlertType.GEOFENCE_BREACH,
      severity: AlertSeverity.CRITICAL,
      status: AlertStatus.ACTIVE,
      message: `Geofence breach: Ship ${shipId} (${shipName}) entered restricted zone "${zoneName}"`,
      timestamp: now,
      shipId,
      shipName,
      zoneId,
      zoneName,
    };

    this.alerts.set(id, alert);
    this.activeGeofenceBreaches.set(key, id);
    this.logger.warn(`[GEOFENCE ALERT] Ship ${shipId} breached ${zoneName}`);

    this.emitAlert(alert);
    return alert;
  }

  /**
   * Resolves an ongoing geofence breach when the ship exits the zone
   */
  resolveGeofenceBreach(shipId: string, zoneId: string): Alert | null {
    const key = `${shipId}_${zoneId}`;
    if (!this.activeGeofenceBreaches.has(key)) {
      return null;
    }

    const alertId = this.activeGeofenceBreaches.get(key)!;
    this.activeGeofenceBreaches.delete(key);

    const alert = this.alerts.get(alertId);
    if (alert && alert.status !== AlertStatus.RESOLVED) {
      alert.status = AlertStatus.RESOLVED;
      alert.resolvedAt = new Date().toISOString();
      this.logger.log(`[GEOFENCE RESOLVED] Ship ${shipId} exited zone ${alert.zoneName}`);
      this.emitAlert(alert);
      return alert;
    }

    return null;
  }

  /**
   * Dispatches or updates a proximity warning between two ships (< 2 km)
   */
  dispatchProximityWarning(
    ship1Id: string,
    ship2Id: string,
    distanceKm: number,
  ): Alert {
    const [s1, s2] = [ship1Id, ship2Id].sort();
    const key = `${s1}_${s2}`;
    const roundedDistance = Number(distanceKm.toFixed(2));

    if (this.activeProximityBreaches.has(key)) {
      const existingId = this.activeProximityBreaches.get(key)!;
      const existingAlert = this.alerts.get(existingId);
      if (existingAlert && existingAlert.status !== AlertStatus.RESOLVED) {
        existingAlert.distance = roundedDistance;
        existingAlert.distanceKm = roundedDistance;
        return existingAlert;
      }
    }

    const now = new Date().toISOString();
    const id = `alert-prox-${s1}-${s2}-${Date.now()}`;
    const alert: Alert = {
      id,
      type: AlertType.PROXIMITY_WARNING,
      severity: AlertSeverity.WARNING,
      status: AlertStatus.ACTIVE,
      message: `Proximity warning: Ships ${s1} and ${s2} are ${roundedDistance} km apart (threshold: 2.0 km)`,
      timestamp: now,
      shipId: s1,
      shipIds: [s1, s2],
      ship1Id: s1,
      ship2Id: s2,
      distance: roundedDistance,
      distanceKm: roundedDistance,
    };

    this.alerts.set(id, alert);
    this.activeProximityBreaches.set(key, id);
    this.logger.warn(`[PROXIMITY WARNING] Ships ${s1} and ${s2} are ${roundedDistance} km apart`);

    this.emitAlert(alert);
    return alert;
  }

  /**
   * Resolves a proximity warning when ships separate beyond 2 km
   */
  resolveProximityWarning(ship1Id: string, ship2Id: string): Alert | null {
    const [s1, s2] = [ship1Id, ship2Id].sort();
    const key = `${s1}_${s2}`;

    if (!this.activeProximityBreaches.has(key)) {
      return null;
    }

    const alertId = this.activeProximityBreaches.get(key)!;
    this.activeProximityBreaches.delete(key);

    const alert = this.alerts.get(alertId);
    if (alert && alert.status !== AlertStatus.RESOLVED) {
      alert.status = AlertStatus.RESOLVED;
      alert.resolvedAt = new Date().toISOString();
      this.logger.log(`[PROXIMITY RESOLVED] Ships ${s1} and ${s2} separated`);
      this.emitAlert(alert);
      return alert;
    }

    return null;
  }

  /**
   * Manually acknowledge an alert
   */
  acknowledgeAlert(id: string): Alert | null {
    const alert = this.alerts.get(id);
    if (!alert) {
      return null;
    }

    if (alert.status === AlertStatus.ACTIVE) {
      alert.status = AlertStatus.ACKNOWLEDGED;
      alert.acknowledgedAt = new Date().toISOString();
      this.emitAlert(alert);
    }
    return alert;
  }

  /**
   * Manually resolve an alert
   */
  resolveAlert(id: string): Alert | null {
    const alert = this.alerts.get(id);
    if (!alert) {
      return null;
    }

    if (alert.status !== AlertStatus.RESOLVED) {
      alert.status = AlertStatus.RESOLVED;
      alert.resolvedAt = new Date().toISOString();

      if (alert.type === AlertType.GEOFENCE_BREACH && alert.shipId && alert.zoneId) {
        this.activeGeofenceBreaches.delete(`${alert.shipId}_${alert.zoneId}`);
      }
      if (alert.type === AlertType.PROXIMITY_WARNING && alert.ship1Id && alert.ship2Id) {
        const [s1, s2] = [alert.ship1Id, alert.ship2Id].sort();
        this.activeProximityBreaches.delete(`${s1}_${s2}`);
      }

      this.emitAlert(alert);
    }
    return alert;
  }

  /**
   * Returns all active and acknowledged alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(
      (a) => a.status === AlertStatus.ACTIVE || a.status === AlertStatus.ACKNOWLEDGED,
    );
  }

  /**
   * Returns all alerts including resolved
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  getAlertById(id: string): Alert | undefined {
    return this.alerts.get(id);
  }

  /**
   * Reset in-memory state (useful for tests)
   */
  clearAll(): void {
    this.alerts.clear();
    this.activeGeofenceBreaches.clear();
    this.activeProximityBreaches.clear();
    this.activeAlerts$.next([]);
  }

  private emitAlert(alert: Alert) {
    this.alert$.next(alert);
    this.activeAlerts$.next(this.getActiveAlerts());
  }
}
