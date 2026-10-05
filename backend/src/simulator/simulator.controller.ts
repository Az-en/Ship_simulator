import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { SimulatorService, RestrictidAreaType } from './simulator.service';
import { AlertsService } from './alerts/alerts.service';

@Controller('simulator')
export class SimulatorController {
  constructor(
    private readonly simulatorService: SimulatorService,
    private readonly alertsService: AlertsService,
  ) {}

  @Get('alerts')
  getAlerts(@Query('all') all?: string) {
    if (all === 'true' || all === '1') {
      return this.alertsService.getAllAlerts();
    }
    return this.alertsService.getActiveAlerts();
  }

  @Post('alerts/:id/acknowledge')
  acknowledgeAlert(@Param('id') id: string) {
    const alert = this.alertsService.acknowledgeAlert(id);
    if (!alert) {
      throw new NotFoundException(`Alert with ID "${id}" not found`);
    }
    return { status: 'Acknowledged', alert };
  }

  @Post('alerts/:id/resolve')
  resolveAlert(@Param('id') id: string) {
    const alert = this.alertsService.resolveAlert(id);
    if (!alert) {
      throw new NotFoundException(`Alert with ID "${id}" not found`);
    }
    return { status: 'Resolved', alert };
  }

  @Get('zones')
  getRestrictedZones() {
    return this.simulatorService.getRestrictedZones();
  }

  @Post('zones')
  async addRestrictedZone(@Body() data: RestrictidAreaType) {
    return await this.simulatorService.handleNewArea(data);
  }

  @Post('start')
  startSimulation() {
    return this.simulatorService.startSimulation();
  }

  @Post('stop')
  stopSimulation() {
    return this.simulatorService.stopSimulation();
  }
}
