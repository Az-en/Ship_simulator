import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Ship, ShipConfig } from './ship/ship.model';
import { Subject } from 'rxjs';
import { clc } from '@nestjs/common/utils/cli-colors.util';
import { ShipRoutingService } from 'src/ship-routing/ship-routing.service';
import { PortsService } from 'src/ports/ports.service';

@Injectable()
export class SimulatorService implements OnModuleInit {
  private readonly logger = new Logger(SimulatorService.name);
  private ships: Ship[] = [];

  // Track our new recursive timeout
  private timeoutId: NodeJS.Timeout | null = null;
  private expectedNextTick: number = 0;
  private shouldCalculateRoute: boolean = true;

  public fleetUpdate$ = new Subject<any[]>(); // an Observable object that we would subscribe to for changes

  constructor(
    private readonly routingService: ShipRoutingService,
    private readonly portService: PortsService,
  ) {}

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

    // Calculate routes on first startup
    if (this.shouldCalculateRoute) {
      this.ships.forEach((ship) => {
        const endCoords = this.portService.getPortCoordinates(
          ship.getDestination(),
        );
        const currentPos = ship.getPosition();
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
    // FIX: Clear the timeoutId, not intervalId
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.logger.log('Simulation stopped.');
  }
}
