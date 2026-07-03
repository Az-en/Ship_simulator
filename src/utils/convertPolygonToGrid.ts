import * as fs from 'fs/promises';
import * as path from 'path';
import type { Postition } from 'src/simulator/ship/ship.model';
// Graph Resolution: 0.1 degrees is roughly 11km spacing.
// (You can lower this to 0.05 for a tighter, more accurate grid, but the file size will grow!)
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

// Interface to strongly type the incoming JSON and fix ESLint 'any' errors
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

// async function generateGrid() {
//   try {
//     console.log(`Reading scenario data from file...`);

//     // Resolve the path to your JSON data file
//     const fleetPath = path.resolve(process.cwd(), 'data/fleet.json');
//     // console.log(fleetPath);
//     const rawData = await fs.readFile(fleetPath, 'utf-8');

//     // Explicitly cast the parsed JSON to our new interface
//     const scenarioData = JSON.parse(rawData) as ScenarioData;

//     // Extract the dynamic data from your JSON (now strongly typed!)
//     const boundingBox = scenarioData.boundingBox;
//     const navigableWater = scenarioData.navigableWater;

//     console.log(`Starting grid generation at ${RESOLUTION}° resolution...`);
//     const grid: Record<string, GridNode> = {};
//     const validPoints: [number, number][] = [];

//     // Step A: Sweep the bounding box and find all safe water points
//     for (
//       let lat = boundingBox.south;
//       lat <= boundingBox.north;
//       lat += RESOLUTION
//     ) {
//       for (
//         let lng = boundingBox.west;
//         lng <= boundingBox.east;
//         lng += RESOLUTION
//       ) {
//         if (isPointInWater([lat, lng], navigableWater)) {
//           validPoints.push([lat, lng]);
//         }
//       }
//     }

//     console.log(
//       `Found ${validPoints.length} valid water nodes. Linking neighbors...`,
//     );

//     // Step B: Calculate neighbors for every safe node

//     // Build the graph dictionary
//     validPoints.forEach(([lat, lng]) => {
//       const key = coordsToKey(lat, lng);
//       const neighbors: string[] = [];

//       neighborOffsets.forEach(([latOffset, lngOffset]) => {
//         const neighborLat = lat + latOffset;
//         const neighborLng = lng + lngOffset;

//         // Check if this potential neighbor is actually in our safe water list
//         if (isPointInWater([neighborLat, neighborLng], navigableWater)) {
//           neighbors.push(coordsToKey(neighborLat, neighborLng));
//         }
//       });

//       grid[key] = { lat, lng, neighbors };
//     });

//     // Step C: Export the pre-computed graph to JSON
//     const outputPath = path.resolve(process.cwd(), 'nav-graph.json');

//     // Use the await fs.writeFile from 'fs/promises'
//     await fs.writeFile(outputPath, JSON.stringify(grid, null, 2));

//     console.log(`✅ Success! Navigable graph saved to: ${outputPath}`);
//   } catch (error) {
//     console.error('❌ Error generating grid:', error);
//   }
// }

export async function createNavigableGrid(polygon: any[]) {
  const fleetPath = path.resolve(process.cwd(), 'data/fleet.json');
  const rawData = await fs.readFile(fleetPath, 'utf-8');

  const scenarioData = JSON.parse(rawData) as ScenarioData;
  const navigableWater = scenarioData.navigableWater;

  // ---------------------------------------------------------
  // FIX 1: Extract the inner array if Leaflet sent a nested array
  const rawCoords = Array.isArray(polygon[0]) ? polygon[0] : polygon;

  // FIX 2: Map using .lng, not .long
  const parsedPolygon = rawCoords.map((coor: any) => {
    // We check for both just in case other parts of your app use 'long'
    const lng = coor.lng !== undefined ? coor.lng : coor.long;
    return [coor.lat, lng];
  });
  // ---------------------------------------------------------

  const validPoints: [number, number][] = [];
  const grid: Record<string, GridNode> = {};
  const boundingBox = scenarioData.boundingBox;

  // OPTIMIZATION: Use a Set for lightning-fast neighbor lookups
  const validPointsSet = new Set<string>();

  // Loop to get all points that are navigable
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

        // Save the key to our fast-lookup set
        validPointsSet.add(coordsToKey(lat, lng));
      }
    }
  }

  // Build neighbors using the Set (No ray-casting required!)
  validPoints.forEach(([lat, lng]) => {
    const key = coordsToKey(lat, lng);
    const neighbors: string[] = [];

    neighborOffsets.forEach(([offsetlat, offsetlng]) => {
      const nLat = lat + offsetlat;
      const nLng = lng + offsetlng;
      const neighborKey = coordsToKey(nLat, nLng);

      // FAST LOOKUP: Does this neighbor exist in our list of valid points?
      if (validPointsSet.has(neighborKey)) {
        neighbors.push(neighborKey);
      }
    });

    grid[key] = { lat, lng, neighbors };
  });

  const outputPath = path.resolve(process.cwd(), 'data/nav-graph.json');
  await fs.writeFile(outputPath, JSON.stringify(grid, null, 2));
}
