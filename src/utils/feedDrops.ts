import { FoodType, TileDef } from '../types';
import { FOODS } from '../config/gameParams';

export interface FeedDrop {
    col: number;
    row: number;
    tile: TileDef;
}

export function buildFeedDropQueue(
    grid: Array<Array<TileDef | null>>,
    remaining: Record<FoodType, number>,
    distribution: number[],
): FeedDrop[] {
    const queue: FeedDrop[] = [];
    const order: FoodType[] = ['bone', 'bamboo', 'banana', 'carrot', 'cheese'];
    const available: Record<FoodType, number> = { ...remaining };
    const workingGrid = grid.map((row) => [...row]);

    for (let col = 0; col < distribution.length; col++) {
        const count = distribution[col] ?? 0;
        for (let i = 0; i < count; i++) {
            const type = order.find((foodType) => available[foodType] > 0) ?? 'bone';
            available[type] -= 1;

            let row = workingGrid.length - 1;
            while (row >= 0 && workingGrid[row][col] !== null) {
                row -= 1;
            }

            if (row < 0) {
                continue;
            }

            workingGrid[row][col] = FOODS[type];
            queue.push({ col, row, tile: FOODS[type] });
        }
    }

    return queue;
}
