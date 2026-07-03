import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Ship } from 'src/simulator/ship/ship.model';
import { Postition } from 'src/simulator/ship/ship.model';
import { isPointInWater } from 'src/utils/convertPolygonToGrid';
// Define the shape of the graph we generated earlier
export interface GridNode {
  lat: number;
  lng: number;
  neighbors: string[];
}

interface RestrictidAreaType {
  coordinates: Postition[];
}
@Injectable()
export class ShipRoutingService implements OnModuleInit {
  private readonly logger = new Logger(ShipRoutingService.name);

  private navGraph: Record<string, GridNode> = {};

  async onModuleInit() {
    await this.loadNavGraph();
  }

  // Load the graph from the JSON file you just generated
  public async loadNavGraph() {
    try {
      const graphPath = path.resolve(process.cwd(), 'data/nav-graph.json');
      const rawData = await fs.readFile(graphPath, 'utf-8');
      this.navGraph = JSON.parse(rawData) as Record<string, GridNode>;

      const nodeCount = Object.keys(this.navGraph).length;
      this.logger.log(
        `A* Routing Engine loaded with ${nodeCount} navigable nodes.`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to load nav-graph.json. Did you run the generator script?',
        error,
      );
    }
  }

  // Helper: Find the closest grid node to any arbitrary [lat, lng]
  private getClosestNode(lat: number, lng: number): string | null {
    let closestKey: string | null = null;
    let shortestDistance = Infinity;

    for (const key in this.navGraph) {
      const node = this.navGraph[key];
      // Using simple Euclidean distance formula for speed (a^2 + b^2 = c^2)
      const distance =
        Math.pow(node.lat - lat, 2) + Math.pow(node.lng - lng, 2);

      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestKey = key;
      }
    }
    return closestKey;
  }

  // 3. Helper: The A* Heuristic (Estimates distance from current node to end node)
  private heuristic(nodeKey: string, targetKey: string): number {
    const node = this.navGraph[nodeKey];
    const target = this.navGraph[targetKey];
    return Math.sqrt(
      Math.pow(node.lat - target.lat, 2) + Math.pow(node.lng - target.lng, 2),
    );
  }

  // The Core A* Pathfinding Algorithm
  public calculatePath(
    startCoords: [number, number],
    endCoords: [number, number],
  ): [number, number][] {
    // Step A: Snap exact coordinates to our grid network
    const startKey = this.getClosestNode(startCoords[0], startCoords[1]);
    const targetKey = this.getClosestNode(endCoords[0], endCoords[1]);

    if (!startKey || !targetKey) {
      this.logger.warn(
        'Could not snap start or end coordinates to the navigable graph.',
      );
      return [];
    }

    // Step B: Set up A* Tracking Variables
    const openSet = new Set<string>([startKey]);
    const cameFrom = new Map<string, string>(); // Keeps track of the path

    // Cost from start to a node
    const gScore = new Map<string, number>();
    gScore.set(startKey, 0);

    // Cost from start to end, passing through a node (gScore + heuristic)
    const fScore = new Map<string, number>();
    fScore.set(startKey, this.heuristic(startKey, targetKey));

    // Step C: The A* Loop
    while (openSet.size > 0) {
      // Find the node in openSet with the lowest fScore
      const currentKey = Array.from(openSet).reduce((lowest, key) => {
        const score = fScore.get(key) ?? Infinity;
        const lowestScore = fScore.get(lowest) ?? Infinity;
        return score < lowestScore ? key : lowest;
      });

      // WIN CONDITION: We reached the target!
      if (currentKey === targetKey) {
        return this.reconstructPath(cameFrom, currentKey);
      }

      openSet.delete(currentKey);
      const currentNode = this.navGraph[currentKey];

      // Check all valid neighbors from our pre-computed graph
      for (const neighborKey of currentNode.neighbors) {
        const neighbor = this.navGraph[neighborKey];

        // Distance between current node and neighbor
        const stepDistance = Math.sqrt(
          Math.pow(currentNode.lat - neighbor.lat, 2) +
            Math.pow(currentNode.lng - neighbor.lng, 2),
        );
        const tentativeGScore =
          (gScore.get(currentKey) ?? Infinity) + stepDistance;

        // If this is the shortest path to this neighbor so far, record it
        if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
          cameFrom.set(neighborKey, currentKey);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(
            neighborKey,
            tentativeGScore + this.heuristic(neighborKey, targetKey),
          );

          if (!openSet.has(neighborKey)) {
            openSet.add(neighborKey);
          }
        }
      }
    }

    this.logger.warn(
      `No valid path found from [${startCoords[0]}, ${startCoords[1]}] to [${endCoords[0]}, ${endCoords[1]}]`,
    );
    return [];
  }

  private reconstructPath(
    cameFrom: Map<string, string>,
    currentKey: string,
  ): [number, number][] {
    const path: [number, number][] = [
      [this.navGraph[currentKey].lat, this.navGraph[currentKey].lng],
    ];

    while (cameFrom.has(currentKey)) {
      currentKey = cameFrom.get(currentKey)!;
      const node = this.navGraph[currentKey];
      // Unshift adds it to the beginning of the array so it reads from Start -> Finish
      path.unshift([node.lat, node.lng]);
    }
    return path;
  }

  // Check if a ship paths goes through a restrictid area
  public checkIfPathIsValid(ship: Ship, polygon: RestrictidAreaType): boolean {
    if (!ship || !polygon || !polygon.coordinates) {
      return true;
    }

    const shipPath = ship.getPath()?.path as [number, number][];
    if (!shipPath || shipPath.length === 0) {
      return true;
    }

    // FIX 1: Extract the inner array (the outer ring of the polygon)
    // We use a safety check just in case it ever comes through as a flat array
    const rawCoords = Array.isArray(polygon.coordinates[0])
      ? polygon.coordinates[0]
      : polygon.coordinates;

    // FIX 2: Map using .lng instead of .long!
    // Note: you may need to cast (coor: any) if your interface says 'long'
    const parsedPolygon = rawCoords.map((coor: any) => [coor.lat, coor.lng]);

    for (const [lat, lng] of shipPath) {
      const doesPassThroughArea = isPointInWater([lat, lng], parsedPolygon);
      if (doesPassThroughArea) {
        return false;
      }
    }
    return true;
  }
}
