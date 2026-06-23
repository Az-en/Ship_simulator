enum Status {
  NORMAL = 'normal',
  REROUTING = 'REROUTING',
  DISTRESSED = 'DISTRESSED',
  STOPPED = 'STOPPED',
}

interface Postition {
  lat: number;
  long: number;
}

export interface ShipConfig {
  shipId: string;
  name: string;
  destination: number;
  position: [number, number];
  speed: number;
  heading: number;
  fuel: number;
  cargo: string;
  status?: Status;
}

export class Ship {
  #shipId: string = '';
  #name: string = '';
  #destination: number = 0;
  #position: Postition;
  #speed: number = 0;
  #heading: number = 0;
  #fuel: number = 0;
  #cargo: string = '';
  #status: Status = Status.NORMAL;
  #hasArrived: boolean | null = null;

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
    return {
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
    };
  }

  updatePosition() {
    this.#position.lat += 1;
    this.#position.long += 1;
  }
}
