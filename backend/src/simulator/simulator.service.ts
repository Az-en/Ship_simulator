import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Ship, ShipConfig, Status, Postition } from './ship/ship.model';
import { Subject } from 'rxjs';
import { clc } from '@nestjs/common/utils/cli-colors.util';
import { ShipRoutingService } from '../ship-routing/ship-routing.service';
import { PortsService } from '../ports/ports.service';
import { createNavigableGrid } from '../utils/convertPolygonToGrid';
import {
  createSafetyBuffer,
  calculateDistanceKm,
  isPointInZone,
} from '../utils/geoMath';
import { AlertsService } from './alerts/alerts.service';
import { RestrictedZone } from './alerts/alert.model';

export class RestrictidAreaType {
  id?: string;
  name?: string;
  coordinates: Postition[] | Postition[][];
}

@Injectable()
export class SimulatorService implements OnModuleInit {
  private readonly logger = new Logger(SimulatorService.name);
  private ships: Ship[] = [];
  private restrictedZones: RestrictedZone[] = [];

  // Track our recursive timeout
  private timeoutId: NodeJS.Timeout | null = null;
  private expectedNextTick: number = 0;
  private shouldCalculateRoute: boolean = true;
  private stopped: boolean = true;

  public fleetUpdate$ = new Subject<any[]>(); // Observable that subscribers listen to for fleet snapshots

  constructor(
    private readonly routingService: ShipRoutingService,
    private readonly portService: PortsService,
    private readonly alertsService: AlertsService,
  ) {}

  async onModuleInit() {
    await this.loadShipsFromJson();
  }

  async loadShipsFromJson() {
    try {
      const filePath = join(__dirname, '..', '..', 'data', 'fleet.json');
      const rawData = await readFile(filePath, 'utf-8');

      const parsedData = JSON.parse(rawData) as { fleet: ShipConfig[] };
      this.ships = parsedData.fleet.map((shipConfig) => new Ship(shipConfig));

      this.logger.log(
        clc.cyanBright(
          `Successfully loaded ${this.ships.length} ships from JSON config.`,
        ),
      );
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error(`Failed to initialize data`, err.stack);
      } else {
        this.logger.error(`Failed to initialize data due to an unknown error`);
      }
    }
  }

  getShips(): Ship[] {
    return this.ships;
  }

  getRestrictedZones(): RestrictedZone[] {
    return this.restrictedZones;
  }

  addRestrictedZone(zone: RestrictedZone) {
    this.restrictedZones.push(zone);
  }

  clearRestrictedZones() {
    this.restrictedZones = [];
  }

  startSimulation() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.stopped) {
      this.stopped = false;
      // Calculate routes on first startup
      if (this.shouldCalculateRoute) {
        this.ships.forEach((ship) => {
          const endCoords = this.portService.getPortCoordinates(
            ship.getDestination(),
          );

          const currentPos = ship.getPosition();
          const startCoords: [number, number] = [
            currentPos.lat,
            currentPos.long,
          ];
          const path = this.routingService.calculatePath(
            startCoords,
            endCoords,
          );
          ship.setPath(path);
        });

        this.shouldCalculateRoute = false;
      }

      // Start the self-correcting game loop
      this.expectedNextTick = Date.now() + 1000;
      this.timeoutId = setTimeout(() => this.runGameLoop(), 1000);
      return { status: 'Started' };
    } else {
      return { error: 'Simulation has already been started' };
    }
  }

  private runGameLoop() {
    const now = Date.now();
    const drift = now - this.expectedNextTick;

    this.tick();

    this.expectedNextTick += 1000;
    const nextDelay = Math.max(0, 1000 - drift);

    this.timeoutId = setTimeout(() => this.runGameLoop(), nextDelay);
  }

  /**
   * Main 1 Hz simulation tick:
   * 1. Updates positions for all ships
   * 2. Checks for geofence breaches (ships within restricted zones)
   * 3. Checks for proximity warnings (ships within 2 km of each other)
   * 4. Emits fleet update snapshot
   */
  public tick() {
    // 1. Update positions for all ships
    this.ships.forEach((ship) => {
      ship.updatePosition();
    });

    // 2. Geofence Alerts: Check if any ship is within any restricted zone
    for (const ship of this.ships) {
      const shipPos = ship.getPosition();
      for (const zone of this.restrictedZones) {
        const isInside = isPointInZone(shipPos, zone.coordinates);
        if (isInside) {
          this.alertsService.dispatchGeofenceBreach(
            ship.getId(),
            ship.getData().name,
            zone.id,
            zone.name,
          );
        } else {
          this.alertsService.resolveGeofenceBreach(ship.getId(), zone.id);
        }
      }
    }

    // 3. Proximity Warnings: Calculate distances between all unique ship pairs
    const PROXIMITY_THRESHOLD_KM = 2.0;
    const shipCount = this.ships.length;
    for (let i = 0; i < shipCount; i++) {
      for (let j = i + 1; j < shipCount; j++) {
        const shipA = this.ships[i];
        const shipB = this.ships[j];
        const distKm = calculateDistanceKm(
          shipA.getPosition(),
          shipB.getPosition(),
        );

        if (distKm <= PROXIMITY_THRESHOLD_KM) {
          this.alertsService.dispatchProximityWarning(
            shipA.getId(),
            shipB.getId(),
            distKm,
          );
        } else {
          this.alertsService.resolveProximityWarning(
            shipA.getId(),
            shipB.getId(),
          );
        }
      }
    }

    // 4. Build and emit fleet snapshot
    const currentSnapshot = this.ships.map((ship) => ship.getData());
    this.fleetUpdate$.next(currentSnapshot);
  }

  stopSimulation() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.stopped = true;
    this.logger.log('Simulation stopped.');
    return { status: 'Stopped' };
  }

  async handleNewArea(data: RestrictidAreaType) {
    try {
      const rawCoords = (
        Array.isArray(data.coordinates[0])
          ? data.coordinates[0]
          : data.coordinates
      ) as Postition[];

      const bufferedPolygonArray = createSafetyBuffer(rawCoords, 0.2);
      const safeData: RestrictidAreaType = {
        coordinates: bufferedPolygonArray.map((c) => ({
          lat: c[0],
          lng: c[1],
          long: c[1],
        })),
      };

      // Store restricted zone
      const zoneId =
        data.id || `zone-${Date.now()}-${this.restrictedZones.length + 1}`;
      const zoneName =
        data.name ||
        data.id ||
        `Restricted-Zone-${this.restrictedZones.length + 1}`;

      const zone: RestrictedZone = {
        id: zoneId,
        name: zoneName,
        coordinates: rawCoords,
        bufferedCoordinates: bufferedPolygonArray,
        createdAt: new Date().toISOString(),
      };
      this.restrictedZones.push(zone);

      // Recalculate grid excluding all active restricted zones (using buffered safety margins)
      const allActiveZonePolygons = this.restrictedZones.map((z) =>
        z.bufferedCoordinates
          ? z.bufferedCoordinates.map((c) => ({ lat: c[0], lng: c[1] }))
          : z.coordinates,
      );
      await createNavigableGrid(allActiveZonePolygons);
      await this.routingService.loadNavGraph();

      // Check if any ship is already inside this new zone or if path intersects it
      const invalidShips: Ship[] = [];

      for (const ship of this.ships) {
        // Immediate geofence alert if ship is already inside newly drawn zone
        const isInside = isPointInZone(ship.getPosition(), rawCoords);
        if (isInside) {
          this.alertsService.dispatchGeofenceBreach(
            ship.getId(),
            ship.getData().name,
            zone.id,
            zone.name,
          );
          ship.setStatus(Status.REROUTING);
          invalidShips.push(ship);
          continue;
        }

        const isPathValid = this.routingService.checkIfPathIsValid(
          ship,
          data as any,
        );

        if (!isPathValid) {
          ship.setStatus(Status.REROUTING);
          invalidShips.push(ship);
        }
      }

      this.recalculatePathsInBackground(invalidShips).catch((err) => {
        if (err instanceof Error) {
          this.logger.error('Background routing failed', err.stack);
        }
      });

      return { status: 'Zone added', zoneId, zoneName };
    } catch (e) {
      if (e instanceof Error) this.logger.error(e.message, e.stack);
      throw e;
    }
  }

  /**
   * Runs completely in the background, updating ships one by one
   * without blocking the main event loop.
   */
  private async recalculatePathsInBackground(ships: Ship[]) {
    for (const ship of ships) {
      await new Promise((resolve) => setImmediate(resolve));

      const parsed: [number, number] = [
        ship.getPosition().lat,
        ship.getPosition().long,
      ];

      // Perform pathfinding
      const newPath = this.routingService.calculatePath(
        parsed,
        this.portService.getPortCoordinates(ship.getDestination()),
      );

      ship.setPath(newPath);
      if (newPath.length === 0) {
        ship.setStatus(Status.STRANDED);
      } else {
        ship.setStatus(Status.NORMAL);
      }
    }
  }

  /**
   * Directive: Hold Position (set status to STOPPED)
   */
  handleDirectiveStop(shipId: string) {
    const ship = this.ships.find((s) => s.getId() === shipId);
    if (!ship) {
      return { error: `Ship with ID ${shipId} not found` };
    }
    ship.setStatus(Status.STOPPED);
    this.logger.log(`[DIRECTIVE] Ship ${shipId} commanded to STOP (Hold Position)`);
    this.fleetUpdate$.next(this.ships.map((s) => s.getData()));
    return { status: 'Stopped', shipId };
  }

  /**
   * Directive: Set Course (recalculate path to selected port)
   */
  handleDirectiveNewCourse(shipId: string, portId: string) {
    const ship = this.ships.find((s) => s.getId() === shipId);
    if (!ship) {
      return { error: `Ship with ID ${shipId} not found` };
    }

    try {
      const endCoords = this.portService.getPortCoordinates(portId);
      const startCoords: [number, number] = [
        ship.getPosition().lat,
        ship.getPosition().long,
      ];

      ship.setDestination(portId);
      ship.setStatus(Status.REROUTING);

      const newPath = this.routingService.calculatePath(startCoords, endCoords);
      ship.setPath(newPath);
      ship.setStatus(newPath.length === 0 ? Status.STRANDED : Status.NORMAL);

      this.logger.log(
        `[DIRECTIVE] Ship ${shipId} course set to ${portId} (${newPath.length} waypoints)`,
      );
      this.fleetUpdate$.next(this.ships.map((s) => s.getData()));
      return {
        status: 'Course updated',
        shipId,
        destination: portId,
        pathLength: newPath.length,
      };
    } catch (err: any) {
      this.logger.error(`Failed to set course for ship ${shipId}: ${err?.message}`);
      return { error: err?.message || 'Failed to calculate new route' };
    }
  }

  /**
   * Directive: Resume Course (set status back to NORMAL)
   */
  handleDirectiveResume(shipId: string) {
    const ship = this.ships.find((s) => s.getId() === shipId);
    if (!ship) {
      return { error: `Ship with ID ${shipId} not found` };
    }
    ship.setStatus(Status.NORMAL);
    this.logger.log(
      `[DIRECTIVE] Ship ${shipId} commanded to RESUME (Status: NORMAL)`,
    );
    this.fleetUpdate$.next(this.ships.map((s) => s.getData()));
    return { status: 'Normal', shipId };
  }
}
