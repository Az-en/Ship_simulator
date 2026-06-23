import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
@Injectable()
export class SimulatorService {
  private readonly logger = new Logger(SimulatorService.name);

  private count = 0;
  private target = 0;
  private intervalId: NodeJS.Timeout | null = null;

  public stateUpdate = new Subject<number>();

  start(targetNumber: number) {
    this.target = targetNumber;
    this.count = 0;
    this.logger.log(`Starting simulator with target ${this.target}`);

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private tick() {
    if (this.count < this.target) {
      this.count++;
      // Announce the new state
      this.stateUpdate.next(this.count);
    } else {
      this.stop();
    }
  }
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.logger.log(`Simulation reached target (${this.target}) and stopped.`);
  }
}
