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
    this.simulatorService.stateUpdate.subscribe((currentCount) => {
      this.server.emit('tickUpdate', { count: currentCount });
    });
  } // <-- The constructor MUST close here

  // This is a separate method on the class now
  @SubscribeMessage('startSimulator')
  handleStartSim(client: any, payload: { target: number }) {
    // Fixed typo: changed simulationService -> simulatorService
    this.simulatorService.start(payload.target || 100);
    return { status: 'Started' };
  }
}
