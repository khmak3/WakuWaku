import { GameEngine } from '../src/engine/GameEngine';
import { addFoodCounts, clampFoodCounts, getFoodTotal, subtractFoodCounts } from '../src/components/FoodFeedPanel';

describe('food stock helpers', () => {
    test('keeps counts from going negative and totals them', () => {
        const start = { bone: 2, bamboo: 1, banana: 0, carrot: 5, cheese: 3 };
        const afterSubtract = subtractFoodCounts(start, { bone: 3, bamboo: 2, banana: 1, carrot: 1, cheese: 4 });

        expect(afterSubtract).toEqual({ bone: 0, bamboo: 0, banana: 0, carrot: 4, cheese: 0 });
        expect(getFoodTotal(afterSubtract)).toBe(4);
        expect(clampFoodCounts({ bone: -2, bamboo: 0, banana: 0, carrot: 1, cheese: 0 })).toEqual({
            bone: 0,
            bamboo: 0,
            banana: 0,
            carrot: 1,
            cheese: 0,
        });
        expect(addFoodCounts({ bone: 1, bamboo: 0, banana: 2, carrot: 0, cheese: 0 }, { bone: 2, banana: 1 })).toEqual({
            bone: 3,
            bamboo: 0,
            banana: 3,
            carrot: 0,
            cheese: 0,
        });
    });
});

describe('GameEngine speed ramp', () => {
    test('drops faster every 200 settled tiles and caps at 10 levels', () => {
        const engine = new GameEngine();

        engine.addDroppedTiles(200);
        expect(engine.getSpeedLevel()).toBe(1);
        expect(engine.getFallIntervalMs()).toBe(950);

        engine.addDroppedTiles(1800);
        expect(engine.getSpeedLevel()).toBe(10);
        expect(engine.getFallIntervalMs()).toBe(500);
    });
});
