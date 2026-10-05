import { Test, TestingModule } from '@nestjs/testing';
import { SimulatorService } from './simulator.service';
import { ShipRoutingService } from '../ship-routing/ship-routing.service';
import { PortsService } from '../ports/ports.service';
import { AlertsService } from './alerts/alerts.service';
import { AlertType } from './alerts/alert.model';
import { Ship, Status } from './ship/ship.model';

describe('SimulatorService', () => {
  let service: SimulatorService;
  let alertsService: AlertsService;

  const mockRoutingService = {
    calculatePath: jest.fn().mockReturnValue([
      [26.55, 56.2],
      [26.0, 56.5],
    ]),
    checkIfPathIsValid: jest.fn().mockReturnValue(true),
    loadNavGraph: jest.fn().mockResolvedValue(undefined),
  };

  const mockPortService = {
    getPortCoordinates: jest.fn().mockReturnValue([23.92, 58.58]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulatorService,
        { provide: ShipRoutingService, useValue: mockRoutingService },
        { provide: PortsService, useValue: mockPortService },
        AlertsService,
      ],
    }).compile();

    service = module.get<SimulatorService>(SimulatorService);
    alertsService = module.get<AlertsService>(AlertsService);
    await service.loadShipsFromJson();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(alertsService).toBeDefined();
  });

  describe('Tick Geofence Verification', () => {
    it('should fire a geofence breach alert when a ship is inside a restricted zone', () => {
      const ships = service.getShips();
      expect(ships.length).toBeGreaterThan(0);
      const ship = ships[0]; // MV-1 at [26.55, 56.2]
      const pos = ship.getPosition();

      // Create a restricted zone surrounding ship MV-1
      service.addRestrictedZone({
        id: 'zone-test-1',
        name: 'Hormuz Warning Area',
        coordinates: [
          { lat: pos.lat - 0.1, lng: pos.long - 0.1 },
          { lat: pos.lat + 0.1, lng: pos.long - 0.1 },
          { lat: pos.lat + 0.1, lng: pos.long + 0.1 },
          { lat: pos.lat - 0.1, lng: pos.long + 0.1 },
          { lat: pos.lat - 0.1, lng: pos.long - 0.1 },
        ],
        createdAt: new Date().toISOString(),
      });

      // Execute simulation tick
      service.tick();

      const activeAlerts = alertsService.getActiveAlerts();
      const geofenceAlert = activeAlerts.find(
        (a) => a.type === AlertType.GEOFENCE_BREACH && a.shipId === ship.getId(),
      );

      expect(geofenceAlert).toBeDefined();
      expect(geofenceAlert?.shipId).toBe(ship.getId());
      expect(geofenceAlert?.zoneName).toBe('Hormuz Warning Area');
      expect(geofenceAlert?.timestamp).toBeDefined();
    });
  });

  describe('Tick Proximity Verification', () => {
    it('should fire a proximity warning when two ships are within 2 km of each other', () => {
      // Force two ships to be close (e.g. ~1 km apart)
      const ships = service.getShips();
      const ship1 = ships[0];
      const ship2 = ships[1];

      // Place ship2 0.009 degrees north of ship1 (~1 km)
      const p1 = ship1.getPosition();
      ship2.getPosition().lat = p1.lat + 0.009;
      ship2.getPosition().long = p1.long;

      service.tick();

      const activeAlerts = alertsService.getActiveAlerts();
      const proximityAlert = activeAlerts.find(
        (a) =>
          a.type === AlertType.PROXIMITY_WARNING &&
          a.shipIds?.includes(ship1.getId()) &&
          a.shipIds?.includes(ship2.getId()),
      );

      expect(proximityAlert).toBeDefined();
      expect(proximityAlert?.shipIds).toContain(ship1.getId());
      expect(proximityAlert?.shipIds).toContain(ship2.getId());
      expect(proximityAlert?.distance).toBeLessThanOrEqual(2.0);
      expect(proximityAlert?.timestamp).toBeDefined();
    });
  });
});
