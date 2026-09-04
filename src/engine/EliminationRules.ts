import { FoodType, TileDef } from '../types';
import { CellPosition, GridCell } from './GameEngine';

export interface EliminationChain {
    actor: CellPosition & { tile: TileDef };
    foods: CellPosition[];
    animals: CellPosition[];
    foodCounts: Partial<Record<FoodType, number>>;
    score: number;
}

const DIRECTIONS: CellPosition[] = [
    { col: 0, row: -1 },
    { col: 1, row: 0 },
    { col: 0, row: 1 },
    { col: -1, row: 0 },
];

function key(cell: CellPosition): string {
    return `${cell.col},${cell.row}`;
}

function at(grid: GridCell[][], col: number, row: number): GridCell {
    return grid[row]?.[col] ?? null;
}

function neighbors(cell: CellPosition): CellPosition[] {
    return DIRECTIONS.map(({ col, row }) => ({ col: cell.col + col, row: cell.row + row }));
}

function isTarget(actor: TileDef, candidate: TileDef): boolean {
    if (actor.type === 'lion') {
        return candidate.kind === 'animal' && candidate.type !== 'lion';
    }
    return candidate.kind === 'food' && candidate.matches === actor.type;
}

/** Finds deterministic DFS eating batches. Food eaters resolve together; Lions resolve only when none exist. */
export class EliminationRules {
    public findNextChain(grid: GridCell[][]): EliminationChain | null {
        return this.findChains(grid)[0] ?? null;
    }

    public isGameOver(_gameState: unknown): boolean {
        return false;
    }

    public checkForElimination(_gameState: unknown, _playerState: unknown): void {
        // Compatibility stub for legacy single-player/two-player wrappers.
    }

    /** Returns all independent chains that should resolve simultaneously in this cascade step. */
    public findChains(grid: GridCell[][]): EliminationChain[] {
        const foodChains = this.findChainsFor(grid, false);
        return foodChains.length > 0 ? foodChains : this.findChainsFor(grid, true);
    }

    private findChainsFor(grid: GridCell[][], lionsOnly: boolean): EliminationChain[] {
        const chains: EliminationChain[] = [];
        const claimed = new Set<string>();
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const actorTile = at(grid, col, row);
                if (!actorTile || actorTile.kind !== 'animal' || (actorTile.type === 'lion') !== lionsOnly) continue;
                if (claimed.has(key({ col, row }))) continue;

                const actor = { col, row, tile: actorTile };
                const targets = this.collectTargets(grid, actor);
                if (targets.length === 0) continue;

                const animals = actorTile.type === 'lion'
                    ? [{ col, row }, ...targets]
                    : this.collectMatchingAnimals(grid, actorTile, targets, { col, row });

                const chain = {
                    actor,
                    foods: actorTile.type === 'lion' ? [] : targets,
                    animals,
                    foodCounts: actorTile.type === 'lion' ? {} : this.countFoods(grid, targets),
                    score: actorTile.type === 'lion' ? 0 : 2 ** targets.length,
                };
                [...chain.foods, ...chain.animals].forEach((cell) => claimed.add(key(cell)));
                chains.push(chain);
            }
        }
        return chains;
    }

    private collectTargets(grid: GridCell[][], actor: EliminationChain['actor']): CellPosition[] {
        const targets: CellPosition[] = [];
        const visited = new Set<string>();
        const visit = (cell: CellPosition): void => {
            for (const next of neighbors(cell)) {
                const tile = at(grid, next.col, next.row);
                if (!tile || !isTarget(actor.tile, tile) || visited.has(key(next))) continue;
                visited.add(key(next));
                targets.push(next);
                visit(next);
            }
        };
        visit(actor);
        return targets;
    }

    private collectMatchingAnimals(
        grid: GridCell[][],
        actor: TileDef,
        foods: CellPosition[],
        actorPosition: CellPosition,
    ): CellPosition[] {
        const matched = new Map<string, CellPosition>([[key(actorPosition), actorPosition]]);
        for (const food of foods) {
            for (const next of neighbors(food)) {
                const tile = at(grid, next.col, next.row);
                if (tile?.kind === 'animal' && tile.type === actor.type) {
                    matched.set(key(next), next);
                }
            }
        }
        return [...matched.values()];
    }

    private countFoods(grid: GridCell[][], foods: CellPosition[]): Partial<Record<FoodType, number>> {
        const counts: Partial<Record<FoodType, number>> = {};
        for (const food of foods) {
            const tile = at(grid, food.col, food.row);
            if (tile?.kind !== 'food') continue;
            const key = tile.type as FoodType;
            counts[key] = (counts[key] ?? 0) + 1;
        }
        return counts;
    }
}