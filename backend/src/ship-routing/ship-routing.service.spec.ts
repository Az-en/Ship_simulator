import { Test, TestingModule } from '@nestjs/testing';
import { ShipRoutingService } from './ship-routing.service';
import { Ship, Status } from '../simulator/ship/ship.model';
import { createNavigableGrid } from '../utils/convertPolygonToGrid';

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

  it('should reset to clean nav-graph from fleet.json on startup discarding prior zones', async () => {
    // 1. Modify nav-graph with a restricted area cut out
    const restrictedArea = [
      { lat: 22.75, lng: 59.75 },
      { lat: 22.85, lng: 59.75 },
      { lat: 22.85, lng: 59.95 },
      { lat: 22.75, lng: 59.95 },
    ];
    await createNavigableGrid(restrictedArea);
    await service.loadNavGraph();
    const restrictedNodeCount = Object.keys((service as any).navGraph).length;

    // 2. Call resetToCleanNavGraph() as happens on server startup
    await service.resetToCleanNavGraph();
    const cleanNodeCount = Object.keys((service as any).navGraph).length;

    // Clean fleet grid should restore the excluded nodes
    expect(cleanNodeCount).toBeGreaterThan(restrictedNodeCount);
    expect(cleanNodeCount).toBe(1819);
  });
});
