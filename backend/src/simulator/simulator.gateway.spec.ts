import { Test, TestingModule } from '@nestjs/testing';
import { SimulatorGateway } from './simulator.gateway';
import { SimulatorService } from './simulator.service';
import { ShipRoutingService } from '../ship-routing/ship-routing.service';
import { AlertsService } from './alerts/alerts.service';
import { RoleService } from './roles/role.service';
import { Subject } from 'rxjs';

describe('SimulatorGateway', () => {
  let gateway: SimulatorGateway;

  const mockSimulatorService = {
    fleetUpdate$: new Subject<any[]>(),
    startSimulation: jest.fn().mockReturnValue({ status: 'Started' }),
    stopSimulation: jest.fn().mockReturnValue({ status: 'Stopped' }),
    handleNewArea: jest.fn().mockResolvedValue({ status: 'Zone added' }),
  };

  const mockRoutingService = {};

  const mockAlertsService = {
    alert$: new Subject<any>(),
    getActiveAlerts: jest.fn().mockReturnValue([]),
    acknowledgeAlert: jest.fn().mockReturnValue({ status: 'Acknowledged' }),
    resolveAlert: jest.fn().mockReturnValue({ status: 'Resolved' }),
  };

  const mockRoleService = {
    getRoleState: jest.fn().mockReturnValue({ commandHolder: null, captainedShips: {} }),
    claimCommand: jest.fn().mockReturnValue({ success: true }),
    claimCaptain: jest.fn().mockReturnValue({ success: true }),
    releaseRole: jest.fn(),
    getSessionRole: jest.fn().mockReturnValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulatorGateway,
        { provide: SimulatorService, useValue: mockSimulatorService },
        { provide: ShipRoutingService, useValue: mockRoutingService },
        { provide: AlertsService, useValue: mockAlertsService },
        { provide: RoleService, useValue: mockRoleService },
      ],
    }).compile();

    gateway = module.get<SimulatorGateway>(SimulatorGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should handle startSimulator message', () => {
    const res = gateway.handleStartSim();
    expect(res).toEqual({ status: 'Started' });
    expect(mockSimulatorService.startSimulation).toHaveBeenCalled();
  });

  it('should handle stopSimulator message', () => {
    const res = gateway.handleStopSim();
    expect(res).toEqual({ status: 'Stopped' });
    expect(mockSimulatorService.stopSimulation).toHaveBeenCalled();
  });

  it('should handle getAlerts message', () => {
    const res = gateway.handleGetAlerts();
    expect(res).toHaveProperty('alerts');
  });
});
