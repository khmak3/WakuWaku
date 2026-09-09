import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TileDef } from '../types';

export const CELL_SIZE = 1;

interface AnimalVisual {
    face: THREE.Group;
    eyes: THREE.Mesh[];
    mouth: THREE.Mesh;
    tongue: THREE.Mesh;
}

const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x2a1c20, roughness: 0.7 });
const creamMaterial = new THREE.MeshStandardMaterial({ color: 0xfff4df, roughness: 0.8 });
const pinkMaterial = new THREE.MeshStandardMaterial({ color: 0xff9bac, roughness: 0.65 });

function sphere(color: number | string, radius: number, x: number, y: number, z: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 16, 12),
        new THREE.MeshStandardMaterial({ color, roughness: 0.65 })
    );
    mesh.position.set(x, y, z);
    return mesh;
}

function addEar(face: THREE.Group, color: number | string, x: number, y: number, scaleY = 1): void {
    const ear = sphere(color, 0.17, x, y, 0.48);
    ear.scale.y = scaleY;
    face.add(ear);
}

function createAnimalGraphic(def: TileDef): AnimalVisual {
    const face = new THREE.Group();
    const headColor: Record<string, number> = {
        lion: 0xffc64a,
        dog: 0xc98552,
        panda: 0xf6f1e8,
        monkey: 0xed9200,
        rabbit: 0xf5eff2,
        mouse: 0xbfc2cc,
    };

    if (def.type === 'lion') {
        const mane = sphere(0x794127, 0.39, 0, 0.02, 0.3);
        mane.scale.y = 1.12;
        face.add(mane);
    }
    face.add(sphere(headColor[def.type], 0.28, 0, 0, 0.56));

    if (def.type === 'panda') {
        addEar(face, 0x27242b, -0.19, 0.21);
        addEar(face, 0x27242b, 0.19, 0.21);
        const leftPatch = sphere(0x3b3740, 0.105, -0.115, 0.04, 0.79);
        const rightPatch = sphere(0x3b3740, 0.105, 0.115, 0.04, 0.79);
        leftPatch.scale.set(1.1, 1.5, 0.45);
        rightPatch.scale.set(1.1, 1.5, 0.45);
        face.add(leftPatch, rightPatch);
    } else if (def.type === 'rabbit') {
        addEar(face, headColor[def.type], -0.13, 0.36, 2.1);
        addEar(face, headColor[def.type], 0.13, 0.36, 2.1);
    } else if (def.type === 'mouse') {
        addEar(face, headColor[def.type], -0.2, 0.2);
        addEar(face, headColor[def.type], 0.2, 0.2);
    } else if (def.type === 'lion') {
        addEar(face, 0x934c24, -0.27, 0.12);
        addEar(face, 0x934c24, 0.27, 0.12);
        addEar(face, 0xffd776, -0.27, 0.12, 0.55);
        addEar(face, 0xffd776, 0.27, 0.12, 0.55);
    } else if (def.type === 'monkey') {
        addEar(face, 0xb55a16, -0.28, 0.1);
        addEar(face, 0xb55a16, 0.28, 0.1);
        addEar(face, 0xffdd9e, -0.28, 0.1, 0.62);
        addEar(face, 0xffdd9e, 0.28, 0.1, 0.62);
    } else if (def.type === 'dog') {
        const leftEar = sphere(0x6d4d3e, 0.14, -0.24, 0.12, 0.53);
        const rightEar = sphere(0x6d4d3e, 0.14, 0.24, 0.12, 0.53);
        leftEar.scale.set(0.7, 1.65, 0.8);
        rightEar.scale.set(0.7, 1.65, 0.8);
        face.add(leftEar, rightEar);
        const leftBrow = sphere(0xf0d1af, 0.07, -0.1, 0.13, 0.84);
        const rightBrow = sphere(0xf0d1af, 0.07, 0.1, 0.13, 0.84);
        leftBrow.scale.set(1.4, 0.45, 0.25);
        rightBrow.scale.set(1.4, 0.45, 0.25);
        face.add(leftBrow, rightBrow);
    } else {
        addEar(face, headColor[def.type], -0.2, 0.2);
        addEar(face, headColor[def.type], 0.2, 0.2);
    }

    const eyeColor = def.type === 'monkey' ? 0x71331b : 0x251c25;
    const eyeRadius = def.type === 'monkey' ? 0.065 : 0.045;
    const eyes = [sphere(eyeColor, eyeRadius, -0.1, 0.05, 0.82), sphere(eyeColor, eyeRadius, 0.1, 0.05, 0.82)];
    const muzzleColor = def.type === 'mouse' ? headColor.mouse : def.type === 'lion' ? 0xffe5a9 : 0xfff4df;
    const muzzle = sphere(muzzleColor, def.type === 'monkey' ? 0.14 : 0.1, 0, -0.1, 0.8);
    muzzle.scale.set(def.type === 'mouse' ? 0.7 : def.type === 'monkey' ? 1.45 : 1.3, def.type === 'mouse' ? 1.35 : def.type === 'monkey' ? 1.2 : 0.75, 0.4);
    muzzle.position.y = def.type === 'mouse' ? -0.16 : -0.1;
    const nose = sphere(def.type === 'mouse' ? 0xf0a0ad : 0x4a2930, 0.035, 0, def.type === 'mouse' ? -0.23 : -0.075, 0.87);
    const mouth = new THREE.Mesh(
        new THREE.TorusGeometry(0.07, 0.014, 8, 16, Math.PI),
        darkMaterial
    );
    mouth.position.set(0, -0.15, 0.84);
    mouth.rotation.z = Math.PI;
    const tongue = sphere(0xff9bac, 0.05, 0, -0.2, 0.86);
    tongue.scale.set(0.8, 1.25, 0.35);
    tongue.visible = false;
    if (def.type === 'monkey') {
        const leftMuzzle = sphere(0xffe5aa, 0.115, -0.08, -0.08, 0.86);
        const rightMuzzle = sphere(0xffe5aa, 0.115, 0.08, -0.08, 0.86);
        const leftHighlight = sphere(0xffffff, 0.017, -0.12, 0.08, 0.89);
        const rightHighlight = sphere(0xffffff, 0.017, 0.08, 0.08, 0.89);
        face.add(leftMuzzle, rightMuzzle, leftHighlight, rightHighlight);
    }
    if (def.type === 'dog') {
        const beard = sphere(0xd8d3c9, 0.125, 0, -0.16, 0.82);
        beard.scale.set(1.25, 1.3, 0.35);
        face.add(beard);
        nose.position.z = 0.91;
        mouth.position.z = 0.91;
    }
    face.add(...eyes, muzzle, nose, mouth, tongue);
    return { face, eyes, mouth, tongue };
}

function createFoodGraphic(def: TileDef): THREE.Group {
    const food = new THREE.Group();
    if (def.type === 'bone') {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.07), creamMaterial);
        bar.position.z = 0.82;
        const ends = [
            sphere(0xfff4df, 0.11, -0.21, 0, 0.82),
            sphere(0xfff4df, 0.11, 0.21, 0, 0.82),
        ];
        food.add(bar, ...ends);
    } else if (def.type === 'bamboo') {
        [-0.12, 0.02, 0.16].forEach((x) => {
            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.52, 10), new THREE.MeshStandardMaterial({ color: 0x65a844 }));
            stalk.position.set(x, 0, 0.58);
            stalk.rotation.z = x * 1.3;
            food.add(stalk);
        });
        const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x3d7c37, roughness: 0.7 });
        [-0.12, 0.08, 0.2].forEach((x, index) => {
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), leafMaterial);
            leaf.scale.set(0.55, 1.6, 0.3);
            leaf.position.set(x, index === 1 ? -0.03 : 0.16, 0.69);
            leaf.rotation.z = index === 1 ? -0.75 : 0.75;
            food.add(leaf);
        });
    } else if (def.type === 'banana') {
        const bananaMaterial = new THREE.MeshStandardMaterial({ color: 0xffd84b, roughness: 0.55 });
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.24, 0.16, 0.82),
            new THREE.Vector3(-0.12, -0.13, 0.82),
            new THREE.Vector3(0.1, -0.18, 0.82),
            new THREE.Vector3(0.25, 0.08, 0.82),
        ]);
        const banana = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.07, 10, false), bananaMaterial);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0x6c4327 }));
        stem.position.set(-0.26, 0.22, 0.82);
        stem.rotation.z = Math.PI * 0.2;
        food.add(banana, stem);
    } else if (def.type === 'carrot') {
        const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 12), new THREE.MeshStandardMaterial({ color: 0xf47b37 }));
        carrot.position.set(0, -0.04, 0.57);
        carrot.rotation.z = Math.PI;
        food.add(carrot);
        food.add(sphere(0x65a844, 0.07, -0.08, 0.25, 0.58), sphere(0x65a844, 0.07, 0.08, 0.25, 0.58));
    } else {
        const cheese = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.42, 3), new THREE.MeshStandardMaterial({ color: 0xffd95c }));
        cheese.position.z = 0.58;
        cheese.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        food.add(cheese, sphere(0xf1a933, 0.04, -0.06, 0.02, 0.78), sphere(0xf1a933, 0.035, 0.08, -0.07, 0.78));
    }
    return food;
}

/** Builds a rounded cube carrying a modeled animal face or food graphic. */
export function createTileMesh(def: TileDef): THREE.Group {
    const group = new THREE.Group();

    const geometry = new RoundedBoxGeometry(CELL_SIZE * 0.9, CELL_SIZE * 0.9, CELL_SIZE * 0.9, 4, 0.12);
    const material = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.45, metalness: 0.05 });
    const box = new THREE.Mesh(geometry, material);
    group.add(box);

    if (def.kind === 'animal') {
        const visual = createAnimalGraphic(def);
        group.add(visual.face);
        group.userData.animalVisual = visual;
    } else {
        group.add(createFoodGraphic(def));
    }

    group.userData.tileType = def.type;
    return group;
}

export function setAnimalFaceExpression(mesh: THREE.Group, expression: 'normal' | 'eating' | 'tasty'): void {
    const visual = mesh.userData.animalVisual as AnimalVisual | undefined;
    if (!visual) return;

    visual.tongue.visible = expression === 'tasty';
    visual.mouth.scale.y = expression === 'eating' ? 1.8 : 1;
    visual.mouth.position.y = expression === 'eating' ? -0.18 : -0.15;
    visual.eyes.forEach((eye) => eye.scale.y = expression === 'tasty' ? 0.3 : 1);
}

export function updateAnimalIdleAnimation(mesh: THREE.Group, now: number): void {
    const visual = mesh.userData.animalVisual as AnimalVisual | undefined;
    if (!visual) return;

    const blinkCycle = (now + mesh.id * 431) % 3600;
    const blinkScale = blinkCycle < 100 ? 0.15 : 1;
    visual.eyes.forEach((eye) => eye.scale.y = blinkScale);
    visual.face.position.y = Math.sin((now + mesh.id * 233) / 720) * 0.012;
}
