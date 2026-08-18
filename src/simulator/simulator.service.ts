import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Ship, ShipConfig } from './ship/ship.model';
import { Subject } from 'rxjs';
import { clc } from '@nestjs/common/utils/cli-colors.util';
import { ShipRoutingService } from 'src/ship-routing/ship-routing.service';
import { PortsService } from 'src/ports/ports.service';
import { createNavigableGrid } from 'src/utils/convertPolygonToGrid';
import { Status } from 'src/simulator/ship/ship.model';
import { createSafetyBuffer } from 'src/utils/geoMath';
import { Postition } from './ship/ship.model';
interface RestrictidAreaType {
  coordinates: Postition[] | Postition[][];
}

@Injectable()
export class SimulatorService implements OnModuleInit {
  private readonly logger = new Logger(SimulatorService.name);
  private ships: Ship[] = [];

  // Track our new recursive timeout
  private timeoutId: NodeJS.Timeout | null = null;
  private expectedNextTick: number = 0;
  private shouldCalculateRoute: boolean = true;
  private stopped: boolean = true;

  public fleetUpdate$ = new Subject<any[]>(); // an Observable object that we would subscribe to for changes

  constructor(
    private readonly routingService: ShipRoutingService,
    private readonly portService: PortsService,
  ) { }

  async onModuleInit() {
    await this.loadShipsFromJson();
  }

  async loadShipsFromJson() {
    try {
      // Use the bulletproof __dirname approach
      const filePath = join(__dirname, '..', '..', 'data', 'fleet.json');
      const rawData = await readFile(filePath, 'utf-8');

      // Cleanly type the JSON parse to avoid bracket notation later
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

  startSimulation() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.stopped) {
      // Calculate routes on first startup
      if (this.shouldCalculateRoute) {
        this.ships.forEach((ship) => {
          const endCoords = this.portService.getPortCoordinates(
            ship.getDestination(),
          );

          const currentPos = ship.getPosition();

          // Ensure currentPos values are treated as numbers
          const startCoords: [number, number] = [currentPos.lat, currentPos.long];

          const path = this.routingService.calculatePath(startCoords, endCoords);

          ship.setPath(path);
        });

        this.shouldCalculateRoute = false;
      }

      // Start the self-correcting game loop
      this.expectedNextTick = Date.now() + 1000;
      this.timeoutId = setTimeout(() => this.runGameLoop(), 1000);
    }
    else {
      return { "error": "Simulation has already been started" }
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

  private tick() {
    // update positions for all elements in memory
    this.ships.forEach((ship) => {
      ship.updatePosition();
    });

    // Build the current raw snapshot data structure array
    const currentSnapshot = this.ships.map((ship) => ship.getData());

    // next means: emit message to all subscribers
    this.fleetUpdate$.next(currentSnapshot);
  }

  stopSimulation() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.logger.log('Simulation stopped.');
  }

  async handleNewArea(data: RestrictidAreaType) {
    try {
      // 1. Calculate the new NavigableArea
      // FIX: Explicitly cast to Postition[] so TS stops worrying about the 2D array
      const rawCoords = (
        Array.isArray(data.coordinates[0])
          ? data.coordinates[0]
          : data.coordinates
      ) as Postition[];

      const bufferedPolygonArray = createSafetyBuffer(rawCoords, 0.2);
      // Convert it back into the format the rest of your app expects
      const safeData: RestrictidAreaType = {
        coordinates: bufferedPolygonArray.map((c) => ({
          lat: c[0],
          lng: c[1],
          long: c[1],
        })),
      };

      await createNavigableGrid(safeData.coordinates as Postition[]);
      await this.routingService.loadNavGraph();

      // 2. check if any ship Path goes through that area
      const invalidShips: Ship[] = []; // to store all ships with invalid paths

      for (const ship of this.ships) {
        const isPathValid = this.routingService.checkIfPathIsValid(
          ship,
          data as any,
        );

        // console.log(`Ship ${ship.getId()} path valid:`, isPathValid);

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
    } catch (e) {
      if (e instanceof Error) this.logger.error(e.message, e.stack);
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

      // Perform the heavy pathfinding math
      const newPath = this.routingService.calculatePath(
        parsed,
        this.portService.getPortCoordinates(ship.getDestination()),
      );

      ship.setPath(newPath);
      if (newPath.length == 0) {
        ship.setStatus(Status.STRANDED)
      }
      else {
        ship.setStatus(Status.NORMAL);
      }
    }
  }
}
