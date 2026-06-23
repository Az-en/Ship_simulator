import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Ship, ShipConfig } from './ship/ship.model';
import { Subject } from 'rxjs';
import { clc } from '@nestjs/common/utils/cli-colors.util';
@Injectable()
export class SimulatorService implements OnModuleInit {
  private readonly logger = new Logger(SimulatorService.name);
  private ships: Ship[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  public fleetUpdate$ = new Subject<any[]>();

  async onModuleInit() {
    await this.loadShipsFromJson();
  }

  async loadShipsFromJson() {
    try {
      const filePath = path.resolve(process.cwd(), 'data/fleet.json');
      const rawData = await fs.readFile(filePath, 'utf-8'); // the raw is in string form

      const parsedData = JSON.parse(rawData) as object;
      const shipConfigs = parsedData['fleet'] as ShipConfig[];
      this.ships = shipConfigs.map((ship) => new Ship(ship));
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
    if (this.intervalId) clearInterval(this.intervalId);

    this.logger.log('Starting Command Center Simulator Core Loop (1 Hz)...');

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000); // 1 Hz rate
  }

  private tick() {
    // update positions for all elements in memory
    this.ships.forEach((ship) => {
      ship.updatePosition();
    });

    //  Build the current raw snapshot data structure array
    const currentSnapshot = this.ships.map((ship) => ship.getData());

    //  send it into pipeline
    this.fleetUpdate$.next(currentSnapshot);
  }

  stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.logger.log('Simulation stopped.');
  }
}
