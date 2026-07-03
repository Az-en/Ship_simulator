import { Module } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { SimulatorController } from './simulator.controller';
import { SimulatorGateway } from './simulator.gateway';
import { ShipRoutingService } from 'src/ship-routing/ship-routing.service';
import { PortsService } from 'src/ports/ports.service';

@Module({
  controllers: [SimulatorController],
  providers: [
    SimulatorService,
    SimulatorGateway,
    ShipRoutingService,
    PortsService,
  ],
})
export class SimulatorModule {}
