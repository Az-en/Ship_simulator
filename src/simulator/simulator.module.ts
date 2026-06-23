import { Module } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { SimulatorController } from './simulator.controller';
import { SimulatorGateway } from './simulator.gateway';

@Module({
  controllers: [SimulatorController],
  providers: [SimulatorService, SimulatorGateway],
})
export class SimulatorModule {}
