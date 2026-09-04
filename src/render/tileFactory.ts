import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TileDef } from '../types';

export const CELL_SIZE = 1;

const iconTextureCache = new Map<string, THREE.CanvasTexture>();

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function getIconTexture(def: TileDef): THREE.CanvasTexture {
    const cached = iconTextureCache.get(def.type);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    roundRect(ctx, 4, 4, 120, 120, 24);
    ctx.fillStyle = def.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.font = '72px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, 64, 70);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    iconTextureCache.set(def.type, texture);
    return texture;
}

/** Builds a rounded cube with the tile's icon printed on its front face. */
export function createTileMesh(def: TileDef): THREE.Group {
    const group = new THREE.Group();

    const geometry = new RoundedBoxGeometry(CELL_SIZE * 0.9, CELL_SIZE * 0.9, CELL_SIZE * 0.9, 4, 0.12);
    const material = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.45, metalness: 0.05 });
    const box = new THREE.Mesh(geometry, material);
    group.add(box);

    const face = new THREE.Mesh(
        new THREE.PlaneGeometry(CELL_SIZE * 0.7, CELL_SIZE * 0.7),
        new THREE.MeshBasicMaterial({ map: getIconTexture(def), transparent: true })
    );
    face.position.z = CELL_SIZE * 0.46;
    group.add(face);

    group.userData.tileType = def.type;
    return group;
}
