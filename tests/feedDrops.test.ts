import { buildFeedDropQueue } from '../src/utils/feedDrops';
import { FOODS } from '../src/config/gameParams';

describe('buildFeedDropQueue', () => {
    test('places incoming feed tiles on the lowest open cells in each column', () => {
        const grid = Array.from({ length: 12 }, () => Array(6).fill(null));
        grid[10][0] = FOODS.bone;
        grid[11][0] = FOODS.banana;

        const queue = buildFeedDropQueue(
            grid,
            {
                bone: 1,
                bamboo: 0,
                banana: 1,
                carrot: 0,
                cheese: 0,
            },
            [2, 0, 0, 0, 0, 0]
        );

        expect(queue).toEqual([
            { col: 0, row: 9, tile: FOODS.bone },
            { col: 0, row: 8, tile: FOODS.banana },
        ]);
    });
});
