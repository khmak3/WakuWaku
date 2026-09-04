import { TileDef } from '../types';
import { GRID_COLS, GRID_ROWS, FALL_INTERVAL_MS } from '../config/gameParams';

/** Second cell's position relative to the anchor: 0=above, 1=right, 2=below, 3=left. */
export type RotationState = 0 | 1 | 2 | 3;

interface PairPiece {
    anchorCol: number;
    anchorRow: number;
    rotation: RotationState;
    tiles: [TileDef, TileDef];
}

interface SoloPiece {
    col: number;
    row: number;
    tile: TileDef;
}

export interface CellPosition {
    col: number;
    row: number;
}

export interface ActiveCell extends CellPosition {
    tile: TileDef;
    /** Whether this cell still has room to fall further (used to avoid anticipating a blocked move). */
    canFall: boolean;
}

export interface LockedCell extends CellPosition {
    tile: TileDef;
}

export type GridCell = TileDef | null;

const ROTATION_OFFSETS: Record<RotationState, CellPosition> = {
    0: { col: 0, row: -1 },
    1: { col: 1, row: 0 },
    2: { col: 0, row: 1 },
    3: { col: -1, row: 0 },
};

/**
 * Owns the well's grid state and the currently falling piece: movement, rotation, gravity,
 * locking, and the "split" behavior where one tile of a pair lands while the other detaches
 * and keeps falling on its own (still player-controlled) until it lands too.
 */
export class GameEngine {
    public grid: GridCell[][];
    public softDropping = false;
    public toppedOut = false;
    private pairPiece: PairPiece | null = null;
    private soloPiece: SoloPiece | null = null;
    private fallAccumulatorMs = 0;

    constructor(public cols: number = GRID_COLS, public rows: number = GRID_ROWS) {
        this.grid = Array.from({ length: rows }, () => Array<GridCell>(cols).fill(null));
    }

    private getPairCells(piece: PairPiece): [ActiveCell, ActiveCell] {
        const offset = ROTATION_OFFSETS[piece.rotation];
        return [
            { col: piece.anchorCol, row: piece.anchorRow, tile: piece.tiles[0], canFall: false },
            { col: piece.anchorCol + offset.col, row: piece.anchorRow + offset.row, tile: piece.tiles[1], canFall: false },
        ];
    }

    /** Returns the cell(s) of whichever piece is currently falling (pair, solo, or none), each flagged with whether it can still fall. */
    public getActiveCells(): ActiveCell[] {
        if (this.pairPiece) {
            const cells = this.getPairCells(this.pairPiece);
            const rawCanFall = cells.map((cell) => this.isCellFree(cell.col, cell.row + 1));

            if (rawCanFall[0] && rawCanFall[1]) {
                cells[0].canFall = true;
                cells[1].canFall = true;
                return cells;
            }
            if (!rawCanFall[0] && !rawCanFall[1]) {
                return cells;
            }

            // Exactly one raw-free: for a vertical pair, that "free" target can actually be the
            // blocked sibling's current cell (empty in the grid only because it hasn't locked
            // yet). Since the blocked cell isn't moving, that target isn't really available.
            const blockedIndex = rawCanFall[0] ? 1 : 0;
            const fallingIndex = blockedIndex === 0 ? 1 : 0;
            const blockedCell = cells[blockedIndex];
            const fallingCell = cells[fallingIndex];
            const targetIsBlockedCell = fallingCell.col === blockedCell.col && fallingCell.row + 1 === blockedCell.row;
            cells[fallingIndex].canFall = !targetIsBlockedCell;
            return cells;
        }
        if (this.soloPiece) {
            const { col, row, tile } = this.soloPiece;
            return [{ col, row, tile, canFall: this.isCellFree(col, row + 1) }];
        }
        return [];
    }

    public hasActivePiece(): boolean {
        return this.pairPiece !== null || this.soloPiece !== null;
    }

    /** Fraction (0..1) through the current fall step, for smooth/interpolated rendering. */
    public getFallProgress(): number {
        if (!this.hasActivePiece()) return 0;
        const interval = this.currentFallInterval();
        return Math.min(this.fallAccumulatorMs / interval, 1);
    }

    private currentFallInterval(): number {
        return this.softDropping ? FALL_INTERVAL_MS / 8 : FALL_INTERVAL_MS;
    }

    private isCellFree(col: number, row: number): boolean {
        if (col < 0 || col >= this.cols || row >= this.rows) return false;
        if (row < 0) return true; // spawn buffer above the visible well
        return this.grid[row][col] === null;
    }

    private isPairValid(piece: PairPiece): boolean {
        return this.getPairCells(piece).every(({ col, row }) => this.isCellFree(col, row));
    }

    /** Spawns a new falling pair; returns false (and sets toppedOut) if the spawn cell is blocked. */
    public spawnPiece(tiles: [TileDef, TileDef]): boolean {
        const piece: PairPiece = {
            anchorCol: Math.floor(this.cols / 2),
            anchorRow: 1,
            rotation: 0,
            tiles,
        };
        if (!this.isPairValid(piece)) {
            this.toppedOut = true;
            this.pairPiece = null;
            this.soloPiece = null;
            return false;
        }
        this.pairPiece = piece;
        this.soloPiece = null;
        this.fallAccumulatorMs = 0;
        return true;
    }

    public moveLeft(): boolean {
        return this.moveBy(-1);
    }

    public moveRight(): boolean {
        return this.moveBy(1);
    }

    private moveBy(dCol: number): boolean {
        if (this.pairPiece) {
            const moved: PairPiece = { ...this.pairPiece, anchorCol: this.pairPiece.anchorCol + dCol };
            if (!this.isPairValid(moved)) return false;
            this.pairPiece = moved;
            return true;
        }
        if (this.soloPiece) {
            const col = this.soloPiece.col + dCol;
            if (!this.isCellFree(col, this.soloPiece.row)) return false;
            this.soloPiece.col = col;
            return true;
        }
        return false;
    }

    /** Rotates the pair; falls back to a 1-cell wall kick if the rotated pose collides. No-op once split into a solo tile. */
    public rotate(direction: 1 | -1): boolean {
        if (!this.pairPiece) return false;
        const rotation = (((this.pairPiece.rotation + direction) % 4 + 4) % 4) as RotationState;
        const rotated: PairPiece = { ...this.pairPiece, rotation };
        for (const kick of [0, -1, 1]) {
            const kicked: PairPiece = { ...rotated, anchorCol: rotated.anchorCol + kick };
            if (this.isPairValid(kicked)) {
                this.pairPiece = kicked;
                return true;
            }
        }
        return false;
    }

    public setSoftDropping(active: boolean): void {
        this.softDropping = active;
    }

    /** Removes empty gaps from every column after an elimination, returning moved cells for rendering. */
    public settleGrid(): LockedCell[] {
        const moved: LockedCell[] = [];
        for (let col = 0; col < this.cols; col++) {
            let writeRow = this.rows - 1;
            for (let row = this.rows - 1; row >= 0; row--) {
                const tile = this.grid[row][col];
                if (!tile) continue;
                if (row !== writeRow) {
                    this.grid[writeRow][col] = tile;
                    this.grid[row][col] = null;
                    moved.push({ col, row: writeRow, tile });
                }
                writeRow--;
            }
        }
        return moved;
    }

    /** Advances gravity by dtMs. Locks (and splits, if needed) once a cell can't fall further. */
    public tick(dtMs: number): LockedCell[] {
        if (!this.hasActivePiece() || this.toppedOut) return [];

        this.fallAccumulatorMs += dtMs;
        const interval = this.currentFallInterval();
        if (this.fallAccumulatorMs < interval) return [];
        this.fallAccumulatorMs -= interval;

        if (this.soloPiece) {
            if (this.isCellFree(this.soloPiece.col, this.soloPiece.row + 1)) {
                this.soloPiece.row += 1;
                return [];
            }
            const locked = { ...this.soloPiece };
            this.soloPiece = null;
            this.grid[locked.row][locked.col] = locked.tile;
            return [locked];
        }

        if (this.pairPiece) {
            const cells = this.getPairCells(this.pairPiece);
            const canFall = cells.map((cell) => this.isCellFree(cell.col, cell.row + 1));

            if (canFall[0] && canFall[1]) {
                this.pairPiece = { ...this.pairPiece, anchorRow: this.pairPiece.anchorRow + 1 };
                return [];
            }

            if (!canFall[0] && !canFall[1]) {
                this.pairPiece = null;
                return cells
                    .filter((cell) => cell.row >= 0)
                    .map((cell) => {
                        this.grid[cell.row][cell.col] = cell.tile;
                        return cell;
                    });
            }

            // Exactly one cell is blocked: lock it, detach the other as a solo falling tile.
            // The still-falling cell completes its move for this tick (same as the "both free"
            // case) so its animation continues without resetting - avoids a visible snap-back.
            const blockedIndex = canFall[0] ? 1 : 0;
            const fallingIndex = blockedIndex === 0 ? 1 : 0;
            const blockedCell = cells[blockedIndex];
            const fallingCell = cells[fallingIndex];

            this.pairPiece = null;
            const lockedCells: LockedCell[] = [];
            if (blockedCell.row >= 0) {
                this.grid[blockedCell.row][blockedCell.col] = blockedCell.tile;
                lockedCells.push(blockedCell);
            }

            // For a vertical pair, the "falling" cell's target can be the exact cell the sibling
            // just locked into (the grid didn't have it yet when `canFall` was computed above).
            // Re-check against the now-updated grid before letting it continue as a solo tile.
            if (this.isCellFree(fallingCell.col, fallingCell.row + 1)) {
                this.soloPiece = { col: fallingCell.col, row: fallingCell.row + 1, tile: fallingCell.tile };
            } else if (fallingCell.row >= 0) {
                this.grid[fallingCell.row][fallingCell.col] = fallingCell.tile;
                lockedCells.push(fallingCell);
            }
            return lockedCells;
        }

        return [];
    }

    public initialize(..._args: unknown[]): void {
        // Compatibility stub for legacy lifecycle wrappers.
    }

    public update(): void {
        // Compatibility stub for legacy lifecycle wrappers.
    }

    public endGame(): void {
        this.toppedOut = true;
    }

    public isGameOver(): boolean {
        return this.toppedOut;
    }

    public start(): void {
        // Compatibility stub for legacy lifecycle wrappers.
    }

    public end(): void {
        this.toppedOut = true;
    }
}

