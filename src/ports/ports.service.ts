import {
  Injectable,
  OnModuleInit,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Port } from './port.model';
import { readFile } from 'fs/promises';
import { join } from 'path';
@Injectable()
export class PortsService implements OnModuleInit {
  private readonly logger = new Logger(PortsService.name);

  private portsMap: Map<string, Port> = new Map();

  async onModuleInit() {
    await this.loadPortData();
  }

  private async loadPortData() {
    const graphPath = join(__dirname, '..', '..', 'data', 'fleet.json');
    console.log(graphPath);
    const rawData = await readFile(graphPath, 'utf-8');
    const parsed = JSON.parse(rawData) as object;
    const ports = parsed['ports'] as Port[];

    ports.forEach((port) => {
      this.portsMap.set(port.id, port);
    });
  }

  public getPortCoordinates(portId: string) {
    if (!portId) throw new NotFoundException('Port Id cannot be null');

    const port = this.portsMap.get(portId);

    if (!port)
      throw new BadRequestException('Port with specified id not found');

    return port.position;
  }
}
