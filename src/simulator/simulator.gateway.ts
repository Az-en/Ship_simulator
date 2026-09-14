import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SimulatorService, RestrictidAreaType } from './simulator.service';
import { Logger } from '@nestjs/common';
import { ShipRoutingService } from '../ship-routing/ship-routing.service';
import { AlertsService } from './alerts/alerts.service';

@WebSocketGateway({ cors: true })
export class SimulatorGateway {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(SimulatorGateway.name);

  constructor(
    private readonly simulatorService: SimulatorService,
    private readonly shipRoutingService: ShipRoutingService,
    private readonly alertsService: AlertsService,
  ) {
    // 1. Subscribe to fleet snapshot updates
    this.simulatorService.fleetUpdate$.subscribe((fleetSnapshot) => {
      this.server?.emit('fleetUpdate', fleetSnapshot);
    });

    // 2. Subscribe to alert lifecycle events and broadcast
    this.alertsService.alert$.subscribe((alert) => {
      this.server?.emit('alert', alert);
      this.server?.emit('alerts', this.alertsService.getActiveAlerts());
    });
  }

  @SubscribeMessage('startSimulator')
  handleStartSim() {
    this.logger.log('Connection received, starting simulator');
    return this.simulatorService.startSimulation();
  }

  @SubscribeMessage('stopSimulator')
  handleStopSim() {
    this.logger.log('Stopping simulator');
    return this.simulatorService.stopSimulation();
  }

  @SubscribeMessage('NewRestrictidArea')
  async handleNewArea(@MessageBody() data: RestrictidAreaType) {
    if (!data || !data.coordinates) {
      return { error: 'No Polygon was sent' };
    }
    this.logger.log('Received NewRestrictidArea');
    const result = await this.simulatorService.handleNewArea(data);
    return result;
  }

  @SubscribeMessage('getAlerts')
  handleGetAlerts() {
    return {
      alerts: this.alertsService.getActiveAlerts(),
    };
  }

  @SubscribeMessage('acknowledgeAlert')
  handleAcknowledgeAlert(@MessageBody() data: { alertId: string }) {
    if (!data?.alertId) {
      return { error: 'alertId is required' };
    }
    const alert = this.alertsService.acknowledgeAlert(data.alertId);
    return alert
      ? { status: 'Acknowledged', alert }
      : { error: 'Alert not found' };
  }

  @SubscribeMessage('resolveAlert')
  handleResolveAlert(@MessageBody() data: { alertId: string }) {
    if (!data?.alertId) {
      return { error: 'alertId is required' };
    }
    const alert = this.alertsService.resolveAlert(data.alertId);
    return alert
      ? { status: 'Resolved', alert }
      : { error: 'Alert not found' };
  }
}
