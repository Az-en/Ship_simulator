import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SimulatorService, RestrictidAreaType } from './simulator.service';
import { Logger } from '@nestjs/common';
import { ShipRoutingService } from '../ship-routing/ship-routing.service';
import { AlertsService } from './alerts/alerts.service';
import { RoleService } from './roles/role.service';

@WebSocketGateway({ cors: true })
export class SimulatorGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(SimulatorGateway.name);

  constructor(
    private readonly simulatorService: SimulatorService,
    private readonly shipRoutingService: ShipRoutingService,
    private readonly alertsService: AlertsService,
    private readonly roleService: RoleService,
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

  // ─── Role lifecycle hooks ───────────────────────────────────

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.roleService.releaseRole(client.id);
    this.server?.emit('roleState', this.roleService.getRoleState());
  }

  @SubscribeMessage('getRoleState')
  handleGetRoleState() {
    return this.roleService.getRoleState();
  }

  @SubscribeMessage('claimRole')
  handleClaimRole(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { role: 'COMMAND' | 'CAPTAIN'; shipId?: string },
  ) {
    let result: { success: boolean; error?: string };

    if (data.role === 'COMMAND') {
      result = this.roleService.claimCommand(client.id);
    } else if (data.role === 'CAPTAIN' && data.shipId) {
      result = this.roleService.claimCaptain(client.id, data.shipId);
    } else {
      result = {
        success: false,
        error: 'Invalid role or missing shipId for Captain',
      };
    }

    if (result.success) {
      this.server?.emit('roleState', this.roleService.getRoleState());
    }
    return result;
  }

  @SubscribeMessage('releaseRole')
  handleReleaseRole(@ConnectedSocket() client: Socket) {
    this.roleService.releaseRole(client.id);
    this.server?.emit('roleState', this.roleService.getRoleState());
    return { success: true };
  }

  // ─── Simulator controls ────────────────────────────────────

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

  @SubscribeMessage('DirectiveStop')
  handleDirectiveStop(@MessageBody() data: { shipId: string }) {
    if (!data?.shipId) {
      return { error: 'shipId is required' };
    }
    return this.simulatorService.handleDirectiveStop(data.shipId);
  }

  @SubscribeMessage('DirectiveNewCourse')
  handleDirectiveNewCourse(
    @MessageBody()
    data: {
      shipId: string;
      portId?: string;
      destination?: string;
    },
  ) {
    const portId = data?.portId || data?.destination;
    if (!data?.shipId || !portId) {
      return { error: 'shipId and portId are required' };
    }
    return this.simulatorService.handleDirectiveNewCourse(data.shipId, portId);
  }

  @SubscribeMessage('DirectiveResume')
  handleDirectiveResume(@MessageBody() data: { shipId: string }) {
    if (!data?.shipId) {
      return { error: 'shipId is required' };
    }
    return this.simulatorService.handleDirectiveResume(data.shipId);
  }
}
