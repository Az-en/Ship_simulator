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

// 1. Define the base coordinate point
export interface Coordinate {
  lat: number;
  lng: number;
}

// 2. Define a single ring of coordinates (like an outer boundary or a hole)
export type PolygonRing = Coordinate[];

// 3. Define the full polygon (an array of rings)
export type DrawnPolygon = PolygonRing[];
