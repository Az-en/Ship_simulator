import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SimulatorModule } from './simulator/simulator.module';
import { CoordinatesController } from './coordinates/coordinates.controller';

@Module({
  imports: [SimulatorModule],
  controllers: [AppController, CoordinatesController],
  providers: [AppService],
})
export class AppModule {}
