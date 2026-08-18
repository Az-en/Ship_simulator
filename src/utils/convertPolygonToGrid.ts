import * as fs from 'fs/promises';
import * as path from 'path';
// Graph Resolution: 0.1 degrees is roughly 11km spacing.
const RESOLUTION = 0.1;
const neighborOffsets = [
  [0, RESOLUTION], // Right
  [0, -RESOLUTION], // Left
  [RESOLUTION, 0], // Up
  [-RESOLUTION, 0], // Down
  // Diagonals
  [RESOLUTION, RESOLUTION], // Top-Right
  [RESOLUTION, -RESOLUTION], // Top-Left
  [-RESOLUTION, RESOLUTION], // Bottom-Right
  [-RESOLUTION, -RESOLUTION], // Bottom-Left
];
interface GridNode {
  lat: number;
  lng: number;
  neighbors: string[]; // Store keys of neighbors for O(1) lookup
}

interface ScenarioData {
  boundingBox: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  navigableWater: number[][];
}

// 2. The Ray-Casting Algorithm
// Checks if a specific [lat, lng] point is inside a polygon
export function isPointInWater(
  point: [number, number],
  polygon: number[][],
): boolean {
  const [y, x] = point; // lat is y, lng is x
  let isInside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) isInside = !isInside;
  }

  return isInside;
}

// Helper to create a consistent string key for our dictionary (e.g., "26.5_56.2")
function coordsToKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

export async function createNavigableGrid(polygon: any[]) {
  const fleetPath = path.resolve(process.cwd(), 'data/fleet.json');
  const rawData = await fs.readFile(fleetPath, 'utf-8');

  const scenarioData = JSON.parse(rawData) as ScenarioData;
  const navigableWater = scenarioData.navigableWater;

  const rawCoords = Array.isArray(polygon[0]) ? polygon[0] : polygon;

  const parsedPolygon = rawCoords.map((coor: any) => {
    // We check for both just in case other parts of your app use 'long'
    const lng = coor.lng !== undefined ? coor.lng : coor.long;
    return [coor.lat, lng];
  });

  const validPoints: [number, number][] = [];
  const grid: Record<string, GridNode> = {};
  const boundingBox = scenarioData.boundingBox;

  const validPointsSet = new Set<string>();

  for (
    let lat = boundingBox.south;
    lat <= boundingBox.north;
    lat += RESOLUTION
  ) {
    for (
      let lng = boundingBox.west;
      lng <= boundingBox.east;
      lng += RESOLUTION
    ) {
      const isInWater = isPointInWater([lat, lng], navigableWater);
      const isInRestrictidArea = isPointInWater([lat, lng], parsedPolygon);

      if (isInWater && !isInRestrictidArea) {
        validPoints.push([lat, lng]);
        validPointsSet.add(coordsToKey(lat, lng));
      }
    }
  }

  validPoints.forEach(([lat, lng]) => {
    const key = coordsToKey(lat, lng);
    const neighbors: string[] = [];

    neighborOffsets.forEach(([offsetlat, offsetlng]) => {
      const nLat = lat + offsetlat;
      const nLng = lng + offsetlng;
      const neighborKey = coordsToKey(nLat, nLng);

      if (validPointsSet.has(neighborKey)) {
        neighbors.push(neighborKey);
      }
    });

    grid[key] = { lat, lng, neighbors };
  });

  const outputPath = path.resolve(process.cwd(), 'data/nav-graph.json');
  await fs.writeFile(outputPath, JSON.stringify(grid, null, 2));
}

if (typeof require !== 'undefined' && require.main === module) {
  createNavigableGrid([]).then(() => {
    console.log("Successfully regenerated clean nav-graph.json!");
  }).catch((err) => {
    console.error("Failed to regenerate nav-graph.json:", err);
  });
}
