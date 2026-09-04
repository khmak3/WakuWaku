import { ANIMALS, FOODS } from '../src/config/gameParams';
import { EliminationRules } from '../src/engine/EliminationRules';
import { GridCell } from '../src/engine/GameEngine';

const rules = new EliminationRules();

function grid(rows = 5, cols = 5): GridCell[][] {
    return Array.from({ length: rows }, () => Array<GridCell>(cols).fill(null));
}

describe('EliminationRules', () => {
    test('follows top, right, bottom, left order through a matching food chain', () => {
        const board = grid();
        board[2][2] = ANIMALS.dog;
        board[1][2] = FOODS.bone;
        board[2][3] = FOODS.bone;
        board[3][2] = FOODS.bone;
        board[2][1] = FOODS.bone;

        const chain = rules.findNextChain(board)!;

        expect(chain.foods).toEqual([
            { col: 2, row: 1 },
            { col: 3, row: 2 },
            { col: 2, row: 3 },
            { col: 1, row: 2 },
        ]);
        expect(chain.foodCounts).toEqual({ bone: 4 });
        expect(chain.score).toBe(16);
    });

    test('merges every matching animal touching a shared food', () => {
        const board = grid();
        board[2][1] = ANIMALS.dog;
        board[2][2] = FOODS.bone;
        board[2][3] = ANIMALS.dog;

        const chain = rules.findNextChain(board)!;

        expect(chain.animals).toEqual([
            { col: 1, row: 2 },
            { col: 3, row: 2 },
        ]);
        expect(chain.foods).toEqual([{ col: 2, row: 2 }]);
        expect(chain.score).toBe(2);
    });

    test('lets Lion eat an unlimited connected chain of non-Lion animals', () => {
        const board = grid(2, 6);
        board[0][0] = ANIMALS.lion;
        board[0][1] = ANIMALS.dog;
        board[0][2] = ANIMALS.panda;
        board[0][3] = ANIMALS.monkey;
        board[0][4] = ANIMALS.rabbit;
        board[0][5] = ANIMALS.mouse;

        const chain = rules.findNextChain(board)!;

        expect(chain.foods).toEqual([]);
        expect(chain.animals).toHaveLength(6);
        expect(chain.score).toBe(0);
    });

    test('returns independent food-eating chains together and defers Lion', () => {
        const board = grid(4, 6);
        board[1][0] = ANIMALS.dog;
        board[1][1] = FOODS.bone;
        board[1][3] = ANIMALS.rabbit;
        board[1][4] = FOODS.carrot;
        board[3][0] = ANIMALS.lion;
        board[3][1] = ANIMALS.monkey;

        const chains = rules.findChains(board);

        expect(chains).toHaveLength(2);
        expect(chains.map((chain) => chain.actor.tile.type)).toEqual(['dog', 'rabbit']);
    });

    test('returns Lion chains only after no food-eating chain remains', () => {
        const board = grid(2, 3);
        board[0][0] = ANIMALS.lion;
        board[0][1] = ANIMALS.dog;

        const chains = rules.findChains(board);

        expect(chains).toHaveLength(1);
        expect(chains[0].actor.tile.type).toBe('lion');
    });

    test('does not resolve matching animals without their favorite food', () => {
        const board = grid();
        board[2][2] = ANIMALS.dog;
        board[2][3] = ANIMALS.dog;

        expect(rules.findNextChain(board)).toBeNull();
    });
});