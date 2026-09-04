export class BlockSpawner {
    private blockTypes: string[];
    private spawnRate: number;

    constructor(blockTypes: string[] = [], spawnRate: number = 1000) {
        this.blockTypes = blockTypes;
        this.spawnRate = spawnRate;
    }

    public spawnBlock(_gameState?: unknown): string {
        if (this.blockTypes.length === 0) {
            return '';
        }

        const randomIndex = Math.floor(Math.random() * this.blockTypes.length);
        return this.blockTypes[randomIndex];
    }

    public getSpawnRate(): number {
        return this.spawnRate;
    }

    public setSpawnRate(newRate: number): void {
        this.spawnRate = newRate;
    }
}