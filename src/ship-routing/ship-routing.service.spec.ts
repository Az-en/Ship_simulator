import { Test, TestingModule } from '@nestjs/testing';
import { ShipRoutingService } from './ship-routing.service';
import { Ship, Status } from '../simulator/ship/ship.model';

describe('ShipRoutingService', () => {
  let service: ShipRoutingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShipRoutingService],
    }).compile();

    service = module.get<ShipRoutingService>(ShipRoutingService);
    await service.loadNavGraph();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate a path between two coordinates', () => {
    // Test known coordinates in navigable waters
    const start: [number, number] = [22.80, 59.80];
    const end: [number, number] = [22.80, 59.90];
    const path = service.calculatePath(start, end);
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThan(0);
  });

  it('should check if ship path intersects restricted area', () => {
    const ship = new Ship({
      shipId: 'MV-TEST',
      name: 'Tester',
      destination: 'MCT-1',
      position: [26.55, 56.2],
      speed: 15,
      heading: 105,
      fuel: 5000,
      cargo: 'crude oil',
      status: Status.NORMAL,
      hasPathChanged: false,
    });

    ship.setPath([
      [26.55, 56.2],
      [26.0, 56.5],
      [25.0, 57.0],
    ]);

    const intersectingZone = {
      coordinates: [
        { lat: 25.9, long: 56.4, lng: 56.4 },
        { lat: 26.1, long: 56.4, lng: 56.4 },
        { lat: 26.1, long: 56.6, lng: 56.6 },
        { lat: 25.9, long: 56.6, lng: 56.6 },
      ],
    };

    const isValid = service.checkIfPathIsValid(ship, intersectingZone as any);
    expect(isValid).toBe(false);
  });
});
