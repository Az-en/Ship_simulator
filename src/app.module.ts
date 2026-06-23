import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SimulatorModule } from './simulator/simulator.module';

@Module({
  imports: [SimulatorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
