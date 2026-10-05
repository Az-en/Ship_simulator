import { Module } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { SimulatorController } from './simulator.controller';
import { SimulatorGateway } from './simulator.gateway';
import { ShipRoutingService } from '../ship-routing/ship-routing.service';
import { PortsService } from '../ports/ports.service';
import { AlertsService } from './alerts/alerts.service';
import { RoleService } from './roles/role.service';

@Module({
  controllers: [SimulatorController],
  providers: [
    SimulatorService,
    SimulatorGateway,
    ShipRoutingService,
    PortsService,
    AlertsService,
    RoleService,
  ],
  exports: [SimulatorService, AlertsService, RoleService],
})
export class SimulatorModule {}

