import * as THREE from 'three';
import { DemoPiece, TileDef } from '../types';
import { ALL_TILES, PREVIEW_COUNT } from '../config/gameParams';
import { createTileMesh } from '../render/tileFactory';

interface PreviewSlot {
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    element: HTMLElement;
}

export function getPreviewScale(slotIndex: number, activeSlotIndex: number): number {
    return slotIndex === activeSlotIndex ? 1.1 : 1;
}

function randomTile(): TileDef {
    return ALL_TILES[Math.floor(Math.random() * ALL_TILES.length)];
}

function randomPiece(): DemoPiece {
    return { cells: [randomTile(), randomTile()], orientation: 'vertical' };
}

/** Renders the upcoming pieces queue as small standalone three.js scenes. */
export class NextBlockPreview {
    private slots: PreviewSlot[] = [];
    private queue: DemoPiece[] = [];

    constructor(private container: HTMLElement, private count: number = PREVIEW_COUNT) {
        this.queue = Array.from({ length: this.count }, () => randomPiece());
        this.buildSlots();
        this.renderQueue();
        window.addEventListener('resize', () => this.handleResize());
    }

    private buildSlots(): void {
        for (let i = 0; i < this.count; i++) {
            const element = document.createElement('div');
            element.className = 'preview-slot';
            this.container.appendChild(element);

            const scene = new THREE.Scene();
            const camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0.1, 10);
            camera.position.z = 5;

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            element.appendChild(renderer.domElement);

            scene.add(new THREE.AmbientLight(0xffffff, 0.8));
            const directional = new THREE.DirectionalLight(0xffffff, 0.6);
            directional.position.set(1, 1, 3);
            scene.add(directional);

            this.slots.push({ scene, camera, renderer, element });
        }
    }

    private renderQueue(): void {
        this.slots.forEach((slot, index) => {
            slot.element.classList.toggle('is-next', index === 0);
            slot.element.style.setProperty('--preview-scale', String(getPreviewScale(index, 0)));
        });

        this.queue.forEach((piece, index) => {
            const slot = this.slots[index];
            if (!slot) return;

            slot.scene.children
                .filter((child) => child.userData.isPieceTile)
                .forEach((child) => slot.scene.remove(child));

            piece.cells.forEach((tileDef, cellIndex) => {
                const mesh = createTileMesh(tileDef);
                mesh.userData.isPieceTile = true;
                mesh.scale.setScalar(0.8);
                mesh.position.y = cellIndex === 0 ? 0.5 : -0.5;
                slot.scene.add(mesh);
            });
        });
    }

    /** Pops the next piece off the queue, pushes a new random one, and re-renders. */
    public shiftQueue(): DemoPiece {
        const next = this.queue.shift()!;
        this.queue.push(randomPiece());
        this.renderQueue();
        return next;
    }

    private handleResize(): void {
        this.slots.forEach((slot) => {
            const width = slot.element.clientWidth || 1;
            const height = slot.element.clientHeight || 1;
            slot.renderer.setSize(width, height, false);
        });
    }

    public render(): void {
        this.handleResize();
        this.slots.forEach((slot) => slot.renderer.render(slot.scene, slot.camera));
    }
}
