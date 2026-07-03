export enum Status {
  NORMAL = 'normal',
  REROUTING = 'REROUTING',
  DISTRESSED = 'DISTRESSED',
  STOPPED = 'STOPPED',
  ARRIVED = 'ARRIVED',
}

export interface Postition {
  lat: number;
  long: number;
  lng?: number;
}

export interface ShipConfig {
  shipId: string;
  name: string;
  destination: string;
  position: [number, number];
  speed: number;
  heading: number;
  fuel: number;
  cargo: string;
  status?: Status;
  hasArrived?: boolean | null;
  path?: [number, number][] | null;
  hasPathChanged: boolean;
}

export class Ship {
  #shipId: string = '';
  #name: string = '';
  #destination: string = '';
  #position: Postition;
  #speed: number = 0;
  #heading: number = 0;
  #fuel: number = 0;
  #cargo: string = '';
  #status: Status = Status.NORMAL;
  #hasArrived: boolean | null = null;
  #path: [number, number][] | null = null;
  #hasPathChanged: boolean = false;

  constructor(config: ShipConfig) {
    this.#shipId = config.shipId;
    this.#name = config.name;
    this.#destination = config.destination;
    this.#position = {
      lat: config.position[0],
      long: config.position[1],
    };
    this.#speed = config.speed;
    this.#heading = config.heading;
    this.#fuel = config.fuel;
    this.#cargo = config.cargo;
    this.#status = config.status ?? Status.NORMAL;
  }

  getData() {
    const data = {
      shipId: this.#shipId,
      name: this.#name,
      destination: this.#destination,
      position: this.#position,
      speed: this.#speed,
      heading: this.#heading,
      fuel: this.#fuel,
      cargo: this.#cargo,
      status: this.#status,
      hasArrived: this.#hasArrived,
      ...(this.#hasPathChanged && { path: this.#path }),
    };
    this.#hasPathChanged = false;
    return data;
  }

  getPath() {
    return {
      path: this.#path,
    };
  }
  getId() {
    return this.#shipId;
  }
  setPath(path: [number, number][]) {
    this.#path = path;
    this.#hasPathChanged = true;
  }
  getStatus() {
    return this.#status;
  }
  setStatus(status: Status) {
    this.#status = status;
  }

  getDestination() {
    return this.#destination;
  }
  getPosition() {
    return this.#position;
  }

  updatePosition() {
    // 1. Guard clause: Do nothing if we've arrived or have no path
    if (this.#hasArrived || !this.#path || this.#path.length === 0) {
      if (!this.#hasArrived && this.#path && this.#path.length === 0) {
        // Failsafe to ensure status updates if it runs out of waypoints
        this.#hasArrived = true;
        this.#status = Status.ARRIVED;
        this.#speed = 0;
      }
      return;
    }

    const target = this.#path[0];
    const targetLat = target[0];
    const targetLng = target[1];

    // Calculate distance on the X (long) and Y (lat) axes
    const dy = targetLat - this.#position.lat;
    const dx = targetLng - this.#position.long;

    // Pythagorean theorem to find the straight-line distance to the target
    const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

    // 3. THE MATH: Convert Ship Speed (Knots) to Map Degrees per Second
    // 1 Knot = 1 Nautical Mile per hour.
    // 1 Degree of latitude/longitude is approximately 60 Nautical Miles.
    const nauticalMilesPerSecond = this.#speed / 3600;
    const degreesPerTick = nauticalMilesPerSecond / 60;

    // 4. Movement Logic
    if (distanceToTarget <= degreesPerTick) {
      // We are close enough to "snap" to the exact waypoint this tick
      this.#position.lat = targetLat;
      this.#position.long = targetLng;

      // Remove the waypoint we just reached from the array
      this.#path.shift();

      // If that was the final waypoint, shut down the engines
      if (this.#path.length === 0) {
        this.#hasArrived = true;
        this.#status = Status.ARRIVED;
        this.#speed = 0;
      }
    } else {
      // We haven't reached it yet, so take one step forward
      const ratio = degreesPerTick / distanceToTarget;
      this.#position.lat += dy * ratio;
      this.#position.long += dx * ratio;

      // Update heading (0-360 degrees) to face the waypoint
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      this.#heading = Math.round(angle >= 0 ? angle : 360 + angle);

      // TODO: Replace fuel burning logic with something this is arbitrary
      const remainingFuel = Math.max(0, this.#fuel - 0.05);
      this.#fuel = Number(remainingFuel.toFixed(2));
    }
  }
}
