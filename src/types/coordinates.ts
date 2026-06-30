export interface boundingBox {
  north: string;
  south: string;
  east: string;
  west: string;
}

export interface navigableWater {
  data: [[number, number]];
}

export interface Port {
  id: string;
  name: string;
  position: [number, number];
}
