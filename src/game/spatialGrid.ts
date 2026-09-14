import { SolidCollider, BuildingPiece } from '../types';

/**
 * High-performance 2D Spatial Hash Grid for fast solid collision and ground elevation lookups.
 * Reduces collision checks from O(N) per entity per frame to O(1) local cells.
 */
export class SpatialColliderGrid {
  private cellSize: number;
  private grid: Map<string, SolidCollider[]> = new Map();
  private buildingGrid: Map<string, BuildingPiece[]> = new Map();

  constructor(cellSize: number = 24.0) {
    this.cellSize = cellSize;
  }

  private cellCoord(val: number): number {
    return Math.floor(val / this.cellSize);
  }

  private cellKey(cx: number, cz: number): string {
    return `${cx}:${cz}`;
  }

  public clear(): void {
    this.grid.clear();
    this.buildingGrid.clear();
  }

  public clearBuildingPieces(): void {
    this.buildingGrid.clear();
  }

  public getColliderBounds(col: SolidCollider): { minX: number; maxX: number; minZ: number; maxZ: number } {
    if (col.type === 'box') {
      return {
        minX: col.minX ?? -1000,
        maxX: col.maxX ?? 1000,
        minZ: col.minZ ?? -1000,
        maxZ: col.maxZ ?? 1000,
      };
    } else {
      const r = col.radius ?? 1.0;
      const x = col.x ?? 0;
      const z = col.z ?? 0;
      return {
        minX: x - r,
        maxX: x + r,
        minZ: z - r,
        maxZ: z + r,
      };
    }
  }

  public add(col: SolidCollider): void {
    const bounds = this.getColliderBounds(col);
    const minCX = this.cellCoord(bounds.minX);
    const maxCX = this.cellCoord(bounds.maxX);
    const minCZ = this.cellCoord(bounds.minZ);
    const maxCZ = this.cellCoord(bounds.maxZ);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cz = minCZ; cz <= maxCZ; cz++) {
        const key = this.cellKey(cx, cz);
        let list = this.grid.get(key);
        if (!list) {
          list = [];
          this.grid.set(key, list);
        }
        list.push(col);
      }
    }
  }

  public addAll(colliders: SolidCollider[]): void {
    for (let i = 0; i < colliders.length; i++) {
      this.add(colliders[i]);
    }
  }

  public remove(col: SolidCollider): void {
    const bounds = this.getColliderBounds(col);
    const minCX = this.cellCoord(bounds.minX);
    const maxCX = this.cellCoord(bounds.maxX);
    const minCZ = this.cellCoord(bounds.minZ);
    const maxCZ = this.cellCoord(bounds.maxZ);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cz = minCZ; cz <= maxCZ; cz++) {
        const key = this.cellKey(cx, cz);
        const list = this.grid.get(key);
        if (list) {
          const idx = list.indexOf(col);
          if (idx !== -1) {
            list.splice(idx, 1);
          }
        }
      }
    }
  }

  public queryAABB(minX: number, minZ: number, maxX: number, maxZ: number): SolidCollider[] {
    const minCX = this.cellCoord(minX);
    const maxCX = this.cellCoord(maxX);
    const minCZ = this.cellCoord(minZ);
    const maxCZ = this.cellCoord(maxZ);

    // Fast path: single cell
    if (minCX === maxCX && minCZ === maxCZ) {
      const list = this.grid.get(this.cellKey(minCX, minCZ));
      return list || [];
    }

    const results: SolidCollider[] = [];
    const seen = new Set<SolidCollider>();

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cz = minCZ; cz <= maxCZ; cz++) {
        const list = this.grid.get(this.cellKey(cx, cz));
        if (list) {
          for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if (!seen.has(item)) {
              seen.add(item);
              results.push(item);
            }
          }
        }
      }
    }
    return results;
  }

  public queryNear(x: number, z: number, radius: number): SolidCollider[] {
    return this.queryAABB(x - radius, z - radius, x + radius, z + radius);
  }

  // --- Dynamic Building Pieces Spatial Management ---
  public addBuildingPiece(piece: BuildingPiece): void {
    const r = 2.5;
    const minCX = this.cellCoord(piece.x - r);
    const maxCX = this.cellCoord(piece.x + r);
    const minCZ = this.cellCoord(piece.z - r);
    const maxCZ = this.cellCoord(piece.z + r);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cz = minCZ; cz <= maxCZ; cz++) {
        const key = this.cellKey(cx, cz);
        let list = this.buildingGrid.get(key);
        if (!list) {
          list = [];
          this.buildingGrid.set(key, list);
        }
        list.push(piece);
      }
    }
  }

  public removeBuildingPiece(pieceId: string): void {
    for (const list of this.buildingGrid.values()) {
      const idx = list.findIndex((p) => p.id === pieceId);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    }
  }

  public queryBuildingPiecesNear(x: number, z: number, radius: number): BuildingPiece[] {
    const minCX = this.cellCoord(x - radius);
    const maxCX = this.cellCoord(x + radius);
    const minCZ = this.cellCoord(z - radius);
    const maxCZ = this.cellCoord(z + radius);

    if (minCX === maxCX && minCZ === maxCZ) {
      return this.buildingGrid.get(this.cellKey(minCX, minCZ)) || [];
    }

    const results: BuildingPiece[] = [];
    const seen = new Set<string>();

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cz = minCZ; cz <= maxCZ; cz++) {
        const list = this.buildingGrid.get(this.cellKey(cx, cz));
        if (list) {
          for (let i = 0; i < list.length; i++) {
            const p = list[i];
            if (!seen.has(p.id)) {
              seen.add(p.id);
              results.push(p);
            }
          }
        }
      }
    }
    return results;
  }

  public queryRay(x1: number, z1: number, x2: number, z2: number): SolidCollider[] {
    const minX = Math.min(x1, x2) - 1.0;
    const maxX = Math.max(x1, x2) + 1.0;
    const minZ = Math.min(z1, z2) - 1.0;
    const maxZ = Math.max(z1, z2) + 1.0;
    return this.queryAABB(minX, minZ, maxX, maxZ);
  }

  public queryBuildingPiecesRay(x1: number, z1: number, x2: number, z2: number): BuildingPiece[] {
    const minX = Math.min(x1, x2) - 2.0;
    const maxX = Math.max(x1, x2) + 2.0;
    const minZ = Math.min(z1, z2) - 2.0;
    const maxZ = Math.max(z1, z2) + 2.0;

    const minCX = this.cellCoord(minX);
    const maxCX = this.cellCoord(maxX);
    const minCZ = this.cellCoord(minZ);
    const maxCZ = this.cellCoord(maxZ);

    const results: BuildingPiece[] = [];
    const seen = new Set<string>();

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cz = minCZ; cz <= maxCZ; cz++) {
        const list = this.buildingGrid.get(this.cellKey(cx, cz));
        if (list) {
          for (let i = 0; i < list.length; i++) {
            const p = list[i];
            if (!seen.has(p.id)) {
              seen.add(p.id);
              results.push(p);
            }
          }
        }
      }
    }
    return results;
  }
}
