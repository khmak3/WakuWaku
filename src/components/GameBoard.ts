import * as THREE from 'three';
import { TileDef } from '../types';
import { GRID_COLS, GRID_ROWS } from '../config/gameParams';
import { createTileMesh, CELL_SIZE } from '../render/tileFactory';

const ACTIVE_PIECE_LERP = 0.35;

/** Renders the well (playing grid) as a 3D scene using three.js. */
export class GameBoard {
    private scene = new THREE.Scene();
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private tileLayer = new THREE.Group();
    private stackMeshes: (THREE.Group | null)[][];
    private activePieceMeshes: THREE.Group[] = [];
    private activePieceTileTypes: string[] = [];

    constructor(private container: HTMLElement, private cols = GRID_COLS, private rows = GRID_ROWS) {
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
        this.stackMeshes = Array.from({ length: this.rows }, () => Array<THREE.Group | null>(this.cols).fill(null));

        this.scene.add(this.tileLayer);
        this.buildWell();
        this.addLighting();
        this.positionCamera();

        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }

    private buildWell(): void {
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(this.cols, this.rows),
            new THREE.MeshStandardMaterial({ color: 0x1e2430 })
        );
        floor.position.z = -0.5;
        this.scene.add(floor);

        const points: THREE.Vector3[] = [];
        for (let c = 0; c <= this.cols; c++) {
            const x = c - this.cols / 2;
            points.push(new THREE.Vector3(x, -this.rows / 2, -0.49), new THREE.Vector3(x, this.rows / 2, -0.49));
        }
        for (let r = 0; r <= this.rows; r++) {
            const y = r - this.rows / 2;
            points.push(new THREE.Vector3(-this.cols / 2, y, -0.49), new THREE.Vector3(this.cols / 2, y, -0.49));
        }
        const gridLines = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: 0x3a4256 })
        );
        this.scene.add(gridLines);

        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x11151d });
        const thickness = 0.3;
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(thickness, this.rows + thickness * 2, 1), wallMaterial);
        leftWall.position.set(-this.cols / 2 - thickness / 2, 0, 0);
        const rightWall = leftWall.clone();
        rightWall.position.x = this.cols / 2 + thickness / 2;
        const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(this.cols + thickness * 2, thickness, 1), wallMaterial);
        bottomWall.position.set(0, -this.rows / 2 - thickness / 2, 0);
        this.scene.add(leftWall, rightWall, bottomWall);
    }

    private addLighting(): void {
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(2, 3, 5);
        this.scene.add(ambient, directional);
    }

    private positionCamera(): void {
        // Frame the full well height (with a small margin) regardless of fov, and keep it
        // centered so top/bottom rows get equal breathing room instead of being clipped.
        const marginFactor = 1.08;
        const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
        const distance = (this.rows * marginFactor) / (2 * Math.tan(fovRad / 2));
        this.camera.position.set(0, 0, distance);
        this.camera.lookAt(0, 0, 0);
    }

    private handleResize(): void {
        const width = this.container.clientWidth || 1;
        const height = this.container.clientHeight || 1;
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    public resize(): void {
        this.handleResize();
        this.render();
    }

    /** Converts grid coordinates (col 0..cols-1 left-to-right, row 0..rows-1 top-to-bottom) to world position. */
    public cellToPosition(col: number, row: number): THREE.Vector3 {
        const x = col - this.cols / 2 + 0.5;
        const y = this.rows / 2 - row - 0.5;
        return new THREE.Vector3(x, y, 0);
    }

    /** Adds or removes a landed tile mesh for the given grid cell (pass null to clear it). */
    public setStackTile(col: number, row: number, def: TileDef | null): void {
        const existing = this.stackMeshes[row]?.[col];
        if (existing) {
            this.tileLayer.remove(existing);
            this.stackMeshes[row][col] = null;
        }
        if (def) {
            const mesh = createTileMesh(def);
            mesh.position.copy(this.cellToPosition(col, row));
            this.tileLayer.add(mesh);
            this.stackMeshes[row][col] = mesh;
        }
    }

    public getStackTileMesh(col: number, row: number): THREE.Group | null {
        return this.stackMeshes[row]?.[col] ?? null;
    }

    /** Rebuilds the landed tile layer after a clear or gravity cascade. */
    public syncStack(grid: (TileDef | null)[][]): void {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.setStackTile(col, row, grid[row][col]);
            }
        }
    }

    /** Clears the well so a fresh round does not keep stale board or active-piece meshes. */
    public clearBoard(): void {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const mesh = this.stackMeshes[row]?.[col];
                if (mesh) {
                    this.tileLayer.remove(mesh);
                    this.stackMeshes[row][col] = null;
                }
            }
        }

        this.activePieceMeshes.forEach((mesh) => this.tileLayer.remove(mesh));
        this.activePieceMeshes = [];
        this.activePieceTileTypes = [];
    }

    /** Animates an animal through an already-ordered DFS path, removing each tile as it leaves it. */
    public playEatingChain(
        actor: { col: number; row: number; tile: TileDef },
        targets: { col: number; row: number }[],
        onLeave: (cell: { col: number; row: number }) => void,
    ): Promise<void> {
        if (targets.length === 0) return Promise.resolve();

        const eater = createTileMesh(actor.tile);
        eater.position.copy(this.cellToPosition(actor.col, actor.row));
        this.tileLayer.add(eater);
        onLeave(actor);

        let targetIndex = 0;
        let startTime = performance.now();
        let from = eater.position.clone();
        let to = this.cellToPosition(targets[0].col, targets[0].row);
        const duration = 240;

        return new Promise((resolve) => {
            const step = (now: number): void => {
                const progress = Math.min((now - startTime) / duration, 1);
                const eased = 1 - (1 - progress) * (1 - progress);
                eater.position.lerpVectors(from, to, eased);
                eater.scale.setScalar(1 + Math.sin(progress * Math.PI) * 0.42);

                if (progress < 1) {
                    requestAnimationFrame(step);
                    return;
                }

                targetIndex++;
                if (targetIndex === targets.length) {
                    onLeave(targets[targetIndex - 1]);
                    this.tileLayer.remove(eater);
                    resolve();
                    return;
                }
                onLeave(targets[targetIndex - 1]);
                from = to;
                to = this.cellToPosition(targets[targetIndex].col, targets[targetIndex].row);
                startTime = now;
                requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        });
    }

    /**
     * Syncs the falling-piece meshes to the engine's active cells (call every frame).
     * Rebuilds the mesh set only when the tile identities change (pair -> solo split, despawn,
     * or a same-size new piece spawning right after the previous one locks); otherwise smoothly
     * interpolates position so falling/rotating/shifting reads as continuous motion instead of
     * snapping cell-by-cell. `fallProgress` (0..1) nudges the target position partway toward the
     * next row for a gapless vertical glide, but only for cells that can still fall - a cell
     * resting against the floor/stack renders at its exact cell, no overshoot.
     */
    public syncActivePiece(cells: { col: number; row: number; tile: TileDef; canFall: boolean }[], fallProgress: number): void {
        const targets = cells.map((cell) => {
            const position = this.cellToPosition(cell.col, cell.row);
            if (cell.canFall) {
                position.y -= fallProgress * CELL_SIZE;
            }
            return position;
        });

        const tileTypes = cells.map((cell) => cell.tile.type);
        const tilesChanged = tileTypes.length !== this.activePieceTileTypes.length
            || tileTypes.some((type, index) => type !== this.activePieceTileTypes[index]);

        if (tilesChanged) {
            this.activePieceMeshes.forEach((mesh) => this.tileLayer.remove(mesh));
            this.activePieceMeshes = cells.map((cell, index) => {
                const mesh = createTileMesh(cell.tile);
                mesh.position.copy(targets[index]);
                this.tileLayer.add(mesh);
                return mesh;
            });
            this.activePieceTileTypes = tileTypes;
            return;
        }

        this.activePieceMeshes.forEach((mesh, index) => mesh.position.lerp(targets[index], ACTIVE_PIECE_LERP));
    }

    /** Pops and shrinks a tile mesh, mimicking the "eaten" enlarge effect, then removes it. */
    public playEatEffect(mesh: THREE.Group): void {
        const start = performance.now();
        const growMs = 220;
        const shrinkMs = 260;
        const baseScale = mesh.scale.x || 1;

        const step = (now: number) => {
            const elapsed = now - start;
            if (elapsed < growMs) {
                mesh.scale.setScalar(baseScale + (elapsed / growMs) * 0.6);
            } else if (elapsed < growMs + shrinkMs) {
                const p = (elapsed - growMs) / shrinkMs;
                mesh.scale.setScalar(Math.max((baseScale + 0.6) * (1 - p), 0.0001));
            } else {
                this.tileLayer.remove(mesh);
                return;
            }
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }
}
