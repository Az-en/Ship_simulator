import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { AlertSeverity, AlertStatus, AlertType } from './alert.model';

describe('AlertsService', () => {
  let service: AlertsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertsService],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Geofence Alerts', () => {
    it('should dispatch a geofence breach alert with shipId, zoneName, and timestamp', () => {
      const alert = service.dispatchGeofenceBreach(
        'MV-1',
        'Aurora',
        'zone-123',
        'Strait Blockade Zone',
      );

      expect(alert).toBeDefined();
      expect(alert.type).toBe(AlertType.GEOFENCE_BREACH);
      expect(alert.severity).toBe(AlertSeverity.CRITICAL);
      expect(alert.status).toBe(AlertStatus.ACTIVE);
      expect(alert.shipId).toBe('MV-1');
      expect(alert.zoneName).toBe('Strait Blockade Zone');
      expect(alert.zoneId).toBe('zone-123');
      expect(alert.timestamp).toBeDefined();
      expect(new Date(alert.timestamp).getTime()).not.toBeNaN();
    });

    it('should not duplicate active geofence alert for same ship and zone', () => {
      const alert1 = service.dispatchGeofenceBreach(
        'MV-1',
        'Aurora',
        'zone-123',
        'Strait Blockade Zone',
      );
      const alert2 = service.dispatchGeofenceBreach(
        'MV-1',
        'Aurora',
        'zone-123',
        'Strait Blockade Zone',
      );

      expect(alert1.id).toBe(alert2.id);
      expect(service.getActiveAlerts().length).toBe(1);
    });

    it('should resolve geofence breach when ship exits zone', () => {
      service.dispatchGeofenceBreach(
        'MV-1',
        'Aurora',
        'zone-123',
        'Strait Blockade Zone',
      );
      expect(service.getActiveAlerts().length).toBe(1);

      const resolved = service.resolveGeofenceBreach('MV-1', 'zone-123');
      expect(resolved).not.toBeNull();
      expect(resolved?.status).toBe(AlertStatus.RESOLVED);
      expect(resolved?.resolvedAt).toBeDefined();
      expect(service.getActiveAlerts().length).toBe(0);
    });
  });

  describe('Proximity Warnings', () => {
    it('should dispatch proximity warning with both ship IDs, distance, and timestamp', () => {
      const alert = service.dispatchProximityWarning('MV-1', 'MV-4', 1.45);

      expect(alert).toBeDefined();
      expect(alert.type).toBe(AlertType.PROXIMITY_WARNING);
      expect(alert.severity).toBe(AlertSeverity.WARNING);
      expect(alert.status).toBe(AlertStatus.ACTIVE);
      expect(alert.shipIds).toEqual(['MV-1', 'MV-4']);
      expect(alert.ship1Id).toBe('MV-1');
      expect(alert.ship2Id).toBe('MV-4');
      expect(alert.distance).toBe(1.45);
      expect(alert.distanceKm).toBe(1.45);
      expect(alert.timestamp).toBeDefined();
      expect(new Date(alert.timestamp).getTime()).not.toBeNaN();
    });

    it('should maintain single active alert and update distance when pair remains close', () => {
      const alert1 = service.dispatchProximityWarning('MV-1', 'MV-4', 1.8);
      const alert2 = service.dispatchProximityWarning('MV-4', 'MV-1', 1.2); // opposite order

      expect(alert1.id).toBe(alert2.id);
      expect(alert2.distance).toBe(1.2);
      expect(service.getActiveAlerts().length).toBe(1);
    });

    it('should resolve proximity warning when ships separate', () => {
      service.dispatchProximityWarning('MV-1', 'MV-4', 1.5);
      expect(service.getActiveAlerts().length).toBe(1);

      const resolved = service.resolveProximityWarning('MV-1', 'MV-4');
      expect(resolved).not.toBeNull();
      expect(resolved?.status).toBe(AlertStatus.RESOLVED);
      expect(service.getActiveAlerts().length).toBe(0);
    });
  });

  describe('Alert Lifecycle Management', () => {
    it('should allow acknowledging active alerts', () => {
      const alert = service.dispatchGeofenceBreach(
        'MV-2',
        'Borealis',
        'zone-1',
        'Zone 1',
      );
      const acknowledged = service.acknowledgeAlert(alert.id);

      expect(acknowledged?.status).toBe(AlertStatus.ACKNOWLEDGED);
      expect(acknowledged?.acknowledgedAt).toBeDefined();
    });

    it('should allow resolving alerts manually', () => {
      const alert = service.dispatchProximityWarning('MV-2', 'MV-3', 0.9);
      const resolved = service.resolveAlert(alert.id);

      expect(resolved?.status).toBe(AlertStatus.RESOLVED);
      expect(resolved?.resolvedAt).toBeDefined();
      expect(service.getActiveAlerts().length).toBe(0);
    });
  });
});
