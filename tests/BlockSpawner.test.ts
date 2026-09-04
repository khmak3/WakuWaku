import { BlockSpawner } from '../src/engine/BlockSpawner';

describe('BlockSpawner', () => {
    let blockSpawner: BlockSpawner;

    beforeEach(() => {
        blockSpawner = new BlockSpawner();
    });

    test('should spawn a block of the correct type', () => {
        const block = blockSpawner.spawnBlock();
        expect(block).toHaveProperty('type');
        expect(blockSpawner.getAvailableBlockTypes()).toContain(block.type);
    });

    test('should spawn blocks at the correct interval', () => {
        jest.useFakeTimers();
        blockSpawner.startSpawning();
        jest.advanceTimersByTime(1000); // Assuming blocks spawn every second
        expect(blockSpawner.getSpawnedBlocks()).toHaveLength(1);
        jest.advanceTimersByTime(1000);
        expect(blockSpawner.getSpawnedBlocks()).toHaveLength(2);
        jest.useRealTimers();
    });

    test('should not spawn more than the maximum allowed blocks', () => {
        blockSpawner.setMaxBlocks(5);
        for (let i = 0; i < 10; i++) {
            blockSpawner.spawnBlock();
        }
        expect(blockSpawner.getSpawnedBlocks()).toHaveLength(5);
    });

    test('should reset spawned blocks when reset is called', () => {
        blockSpawner.spawnBlock();
        blockSpawner.reset();
        expect(blockSpawner.getSpawnedBlocks()).toHaveLength(0);
    });
});