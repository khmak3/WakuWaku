import { GameEngine } from '../engine/GameEngine';
import { GameState } from '../state/GameState';
import { PlayerState } from '../state/PlayerState';
import { EliminationRules } from '../engine/EliminationRules';
import { BlockSpawner } from '../engine/BlockSpawner';

export class SinglePlayerMode {
    private gameEngine: GameEngine;
    private gameState: GameState;
    private playerState: PlayerState;
    private eliminationRules: EliminationRules;
    private blockSpawner: BlockSpawner;

    constructor() {
        this.gameState = new GameState(1);
        this.playerState = new PlayerState(1);
        this.eliminationRules = new EliminationRules();
        this.blockSpawner = new BlockSpawner([], 1000);
        this.gameEngine = new GameEngine();
    }

    public startGame(): void {
        this.gameEngine.initialize();
        this.gameLoop();
    }

    private gameLoop(): void {
        const update = () => {
            this.gameEngine.update();
            this.checkGameOver();
            requestAnimationFrame(update);
        };
        update();
    }

    private checkGameOver(): void {
        if (this.eliminationRules.isGameOver(this.gameState)) {
            this.gameEngine.endGame();
        }
    }

    public handlePlayerAction(action: string): void {
        this.playerState.performAction(action);
        this.eliminationRules.checkForElimination(this.gameState, this.playerState);
        this.blockSpawner.spawnBlock(this.gameState);
    }
}