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

/**
 * Calculates the great-circle distance between two lat/lng coordinates in kilometers using Turf.
 */
export function calculateDistanceKm(
  coord1: LatLngInput,
  coord2: LatLngInput,
): number {
  const lng1 = coord1.lng !== undefined ? coord1.lng : coord1.long;
  const lng2 = coord2.lng !== undefined ? coord2.lng : coord2.long;
  if (lng1 === undefined || lng2 === undefined) {
    throw new Error('Invalid coordinates: missing longitude.');
  }
  const from = turf.point([lng1, coord1.lat]);
  const to = turf.point([lng2, coord2.lat]);
  return turf.distance(from, to, { units: 'kilometers' });
}

/**
 * Checks if a point (lat/lng) is within a polygonal zone using Turf.
 */
export function isPointInZone(
  point: LatLngInput,
  polygonCoords: LatLngInput[],
): boolean {
  if (!polygonCoords || polygonCoords.length < 3) {
    return false;
  }
  const ptLng = point.lng !== undefined ? point.lng : point.long;
  if (ptLng === undefined) {
    throw new Error('Invalid point: missing longitude.');
  }
  const pt = turf.point([ptLng, point.lat]);

  const geoJsonCoords: number[][] = polygonCoords.map((c) => {
    const lng = c.lng !== undefined ? c.lng : c.long;
    if (lng === undefined) {
      throw new Error('Invalid polygon coordinate: missing longitude.');
    }
    return [lng, c.lat];
  });

  const firstPoint = geoJsonCoords[0];
  const lastPoint = geoJsonCoords[geoJsonCoords.length - 1];
  if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
    geoJsonCoords.push([...firstPoint]);
  }

  const poly = turf.polygon([geoJsonCoords]);
  return turf.booleanPointInPolygon(pt, poly);
}

