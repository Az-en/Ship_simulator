import { Controller, Get } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
@Controller('coordinates')
export class CoordinatesController {
  @Get('navigableWater')
  async getNavigableWater() {
    const graphPath = join(__dirname, '..', '..', 'data', 'fleet.json');
    const rawData = await readFile(graphPath, 'utf-8');
    const parsed = JSON.parse(rawData) as object;

    const navigableWater = parsed['navigableWater'] as [
      [number, number] | null,
    ];

    return navigableWater;
  }

  @Get('boundingBox')
  async getboundingBox() {
    const graphPath = join(__dirname, '..', '..', 'data', 'fleet.json');
    const rawData = await readFile(graphPath, 'utf-8');
    const parsed = JSON.parse(rawData) as object;

    const bb = parsed['boundingBox'] as object;

    return bb;
  }

  @Get('ports')
  async getPorts() {
    const graphPath = join(__dirname, '..', '..', 'data', 'fleet.json');
    const rawData = await readFile(graphPath, 'utf-8');
    const parsed = JSON.parse(rawData) as object;

    const ports = parsed['ports'] as object;

    return ports;
  }
  @Get('Ships')
  async getShips() {
    const graphPath = join(__dirname, '..', '..', 'data', 'fleet.json');
    const rawData = await readFile(graphPath, 'utf-8');
    const parsed = JSON.parse(rawData) as object;

    const ports = parsed['fleet'] as object;
    return ports;
  }
}
