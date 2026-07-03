import * as turf from '@turf/turf';

export interface LatLngInput {
  lat: number;
  lng?: number;
  long?: number;
}

export function createSafetyBuffer(
  leafletPolygonCoords: LatLngInput[],
  bufferRadiusKm = 0.2,
): [number, number][] {
  // 1. Map to standard number array (No 'any' used here)
  const geoJsonCoords: number[][] = leafletPolygonCoords.map((c) => {
    const lng = c.lng !== undefined ? c.lng : c.long;
    if (lng === undefined) {
      throw new Error('Invalid coordinate: missing longitude.');
    }
    return [lng, c.lat];
  });

  // 2. GeoJSON polygons must be closed
  const firstPoint = geoJsonCoords[0];
  const lastPoint = geoJsonCoords[geoJsonCoords.length - 1];
  if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
    geoJsonCoords.push([...firstPoint]);
  }

  // FIX 1: Removed the extra brackets!
  // turf.polygon expects an array of rings. [geoJsonCoords] is exactly one ring.
  const poly = turf.polygon([geoJsonCoords]);

  // 3. Create the buffer
  const buffered = turf.buffer(poly, bufferRadiusKm, { units: 'kilometers' });

  if (!buffered || !buffered.geometry) {
    throw new Error('Failed to generate a safety buffer.');
  }

  // FIX 2: Instead of forcing a type cast that breaks across Turf versions,
  // we use a Type Guard. This perfectly satisfies TypeScript.
  if (buffered.geometry.type !== 'Polygon') {
    throw new Error('Buffered geometry is not a simple Polygon.');
  }

  // Because of the check above, TS now guarantees this is a Position[][]
  const newCoords = buffered.geometry.coordinates[0];

  // FIX 3: Explicitly type the return of the map function to satisfy ESLint's no-unsafe-return
  return newCoords.map((coord: number[]): [number, number] => {
    return [coord[1], coord[0]];
  });
}
