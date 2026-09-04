import { AnimalType, FoodType, TileDef } from '../types';

export const GRID_COLS = 6;
export const GRID_ROWS = 12;
export const PREVIEW_COUNT = 4;
export const FALL_INTERVAL_MS = 1000;

export const ANIMALS: Record<AnimalType, TileDef> = {
    lion: { kind: 'animal', type: 'lion', label: 'Lion', color: '#1a1a1a', icon: '🦁' },
    dog: { kind: 'animal', type: 'dog', label: 'Dog', color: '#2b6cff', icon: '🐶' },
    panda: { kind: 'animal', type: 'panda', label: 'Panda', color: '#e53935', icon: '🐼' },
    monkey: { kind: 'animal', type: 'monkey', label: 'Monkey', color: '#43a047', icon: '🐵' },
    rabbit: { kind: 'animal', type: 'rabbit', label: 'Rabbit', color: '#fdd835', icon: '🐰' },
    mouse: { kind: 'animal', type: 'mouse', label: 'Mouse', color: '#f5f5f5', icon: '🐭' },
};

export const FOODS: Record<FoodType, TileDef> = {
    bone: { kind: 'food', type: 'bone', label: 'Bone', color: '#2b6cff', icon: '🦴', matches: 'dog' },
    bamboo: { kind: 'food', type: 'bamboo', label: 'Bamboo', color: '#e53935', icon: '🎋', matches: 'panda' },
    banana: { kind: 'food', type: 'banana', label: 'Banana', color: '#43a047', icon: '🍌', matches: 'monkey' },
    carrot: { kind: 'food', type: 'carrot', label: 'Carrot', color: '#fdd835', icon: '🥕', matches: 'rabbit' },
    cheese: { kind: 'food', type: 'cheese', label: 'Cheese', color: '#f5f5f5', icon: '🧀', matches: 'mouse' },
};

export const ALL_TILES: TileDef[] = [...Object.values(ANIMALS), ...Object.values(FOODS)];
