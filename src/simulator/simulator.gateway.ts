import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SimulatorService } from './simulator.service';

@WebSocketGateway({ cors: true })
export class SimulatorGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly simulatorService: SimulatorService) {
    this.simulatorService.fleetUpdate$.subscribe((fleetSnapshot) => {
      // This shoots the raw json snapshot array down to everyone watching the dashboard
      this.server.emit('fleetUpdate', fleetSnapshot);
    });
  }

  @SubscribeMessage('startSimulator')
  handleStartSim() {
    this.simulatorService.startSimulation();
    return { status: 'Started' };
  }
}
