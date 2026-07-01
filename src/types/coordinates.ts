export interface boundingBox {
  north: string;
  south: string;
  east: string;
  west: string;
}

export type navigableWater = [number, number][];

export interface Port {
  id: string;
  name: string;
  position: [number, number];
}
