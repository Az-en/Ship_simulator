import { Test, TestingModule } from '@nestjs/testing';
import { SimulatorGateway } from './simulator.gateway';

describe('SimulatorGateway', () => {
  let gateway: SimulatorGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SimulatorGateway],
    }).compile();

    gateway = module.get<SimulatorGateway>(SimulatorGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
