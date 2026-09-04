export type AnimalType = 'lion' | 'dog' | 'panda' | 'monkey' | 'rabbit' | 'mouse';
export type FoodType = 'bone' | 'bamboo' | 'banana' | 'carrot' | 'cheese';
export type TileKind = 'animal' | 'food';

export interface TileDef {
    kind: TileKind;
    type: AnimalType | FoodType;
    label: string;
    color: string;
    icon: string;
    /** For food tiles only: the animal type it feeds. */
    matches?: AnimalType;
}

export type PieceOrientation = 'vertical' | 'horizontal';

export interface DemoPiece {
    cells: [TileDef, TileDef];
    orientation: PieceOrientation;
}

export type PlayerAction = 'moveLeft' | 'moveRight' | 'rotateLeft' | 'rotateRight' | 'softDrop';

export interface Player {
    id: number;
    score: number;
    currentAction: PlayerAction | null;
}
