import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SimulatorService } from './simulator.service';
import { Logger } from '@nestjs/common';
import type { Postition } from './ship/ship.model';
import { ShipRoutingService } from 'src/ship-routing/ship-routing.service';
interface RestrictidAreaType {
  coordinates: Postition[];
}
@WebSocketGateway({ cors: true })
export class SimulatorGateway {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(SimulatorGateway.name);
  constructor(
    private readonly simulatorService: SimulatorService,
    private readonly shipRoutingService: ShipRoutingService,
  ) {
    this.simulatorService.fleetUpdate$.subscribe((fleetSnapshot) => {
      // This shoots the raw json snapshot array down to everyone watching the dashboard
      this.server.emit('fleetUpdate', fleetSnapshot);
    });
  }

  @SubscribeMessage('startSimulator')
  handleStartSim() {
    this.logger.log('Connection received, starting simulator');
    this.simulatorService.startSimulation();
    return { status: 'Started' };
  }
  @SubscribeMessage('stopSimulator')
  handleStopSim() {
    this.logger.log('Stopping simulator');
    this.simulatorService.stopSimulation();
    return { status: "Stopped" }
  }
  @SubscribeMessage('NewRestrictidArea')
  async handleNewArea(@MessageBody() data: RestrictidAreaType) {
    if (!data || !data.coordinates) return { error: 'No Polygon was sent' };
    console.log(data.coordinates);
    await this.simulatorService.handleNewArea(data);
  }
}
