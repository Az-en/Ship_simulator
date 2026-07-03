import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SimulatorModule } from './simulator/simulator.module';
import { ShipRoutingService } from './ship-routing/ship-routing.service';
import { PortsService } from './ports/ports.service';
import { CoordinatesController } from './coordinates/coordinates.controller';

@Module({
  imports: [SimulatorModule],
  controllers: [AppController, CoordinatesController],
  providers: [AppService, ShipRoutingService, PortsService],
})
export class AppModule {}
