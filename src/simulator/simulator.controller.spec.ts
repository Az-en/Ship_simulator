import { Test, TestingModule } from '@nestjs/testing';
import { SimulatorController } from './simulator.controller';
import { SimulatorService } from './simulator.service';
import { AlertsService } from './alerts/alerts.service';
import { AlertStatus, AlertType, AlertSeverity } from './alerts/alert.model';

describe('SimulatorController', () => {
  let controller: SimulatorController;
  let alertsService: AlertsService;
  let simulatorService: SimulatorService;

  const mockSimulatorService = {
    startSimulation: jest.fn().mockReturnValue({ status: 'Started' }),
    stopSimulation: jest.fn().mockReturnValue({ status: 'Stopped' }),
    getRestrictedZones: jest.fn().mockReturnValue([]),
    handleNewArea: jest.fn().mockResolvedValue({ status: 'Zone added' }),
  };

  const mockAlertsService = {
    getActiveAlerts: jest.fn().mockReturnValue([
      {
        id: 'alert-1',
        type: AlertType.GEOFENCE_BREACH,
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.ACTIVE,
        shipId: 'MV-1',
        zoneName: 'Test Zone',
        timestamp: new Date().toISOString(),
      },
    ]),
    getAllAlerts: jest.fn().mockReturnValue([]),
    acknowledgeAlert: jest.fn().mockImplementation((id: string) => ({
      id,
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date().toISOString(),
    })),
    resolveAlert: jest.fn().mockImplementation((id: string) => ({
      id,
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date().toISOString(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimulatorController],
      providers: [
        { provide: SimulatorService, useValue: mockSimulatorService },
        { provide: AlertsService, useValue: mockAlertsService },
      ],
    }).compile();

    controller = module.get<SimulatorController>(SimulatorController);
    alertsService = module.get<AlertsService>(AlertsService);
    simulatorService = module.get<SimulatorService>(SimulatorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return active alerts on GET /simulator/alerts', () => {
    const alerts = controller.getAlerts();
    expect(alerts).toBeDefined();
    expect(alerts.length).toBe(1);
    expect(alerts[0].shipId).toBe('MV-1');
  });

  it('should acknowledge alert on POST /simulator/alerts/:id/acknowledge', () => {
    const res = controller.acknowledgeAlert('alert-1');
    expect(res.status).toBe('Acknowledged');
    expect(res.alert.status).toBe(AlertStatus.ACKNOWLEDGED);
  });

  it('should resolve alert on POST /simulator/alerts/:id/resolve', () => {
    const res = controller.resolveAlert('alert-1');
    expect(res.status).toBe('Resolved');
    expect(res.alert.status).toBe(AlertStatus.RESOLVED);
  });
});
