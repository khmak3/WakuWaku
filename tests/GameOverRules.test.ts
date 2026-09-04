import { GameOverRules } from '../src/engine/GameOverRules';

describe('GameOverRules', () => {
    let gameOverRules: GameOverRules;

    beforeEach(() => {
        gameOverRules = new GameOverRules();
    });

    test('should end the game when player score reaches zero', () => {
        const playerState = { score: 0 };
        expect(gameOverRules.checkGameOver(playerState)).toBe(true);
    });

    test('should not end the game when player score is above zero', () => {
        const playerState = { score: 10 };
        expect(gameOverRules.checkGameOver(playerState)).toBe(false);
    });

    test('should end the game when maximum blocks are reached', () => {
        const gameState = { blocks: 100, maxBlocks: 100 };
        expect(gameOverRules.checkGameOver(gameState)).toBe(true);
    });

    test('should not end the game when blocks are below maximum', () => {
        const gameState = { blocks: 99, maxBlocks: 100 };
        expect(gameOverRules.checkGameOver(gameState)).toBe(false);
    });
});